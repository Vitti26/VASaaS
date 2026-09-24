"use server";

import { db, withDbFallback } from "@/modules/shared/infrastructure/db";
import { revalidatePath } from "next/cache";
import { createPublicBookingService } from "./domain/appointment-service";
import { PublicBookingInput, PublicBookingSchema } from "./domain/appointment";
import { prismaAppointmentRepository } from "./infrastructure/prisma-appointment-repository";

// In-memory fallback store when DB is offline
const fallbackAppointmentsStore: any[] = [
  {
    id: "apt-demo-1",
    customerName: "Carlos Gómez",
    customerPhone: "+54 11 9999-8888",
    serviceName: "Corte de Cabello + Peinado",
    servicePrice: 9500,
    staffName: "Juan Carlos Owner",
    startAt: "10:00 hs",
    status: "CONFIRMED",
  },
  {
    id: "apt-demo-2",
    customerName: "Ana Martínez",
    customerPhone: "+54 11 4444-3333",
    serviceName: "Coloración + Lavado",
    servicePrice: 18000,
    staffName: "María Barbera",
    startAt: "11:30 hs",
    status: "PENDING",
  },
];

export async function getAppointmentsAction(tenantId?: string, branchId?: string) {
  return withDbFallback(async () => {
    let targetTenantId = tenantId;
    if (!targetTenantId) {
      const defaultTenant = await db.tenant.findFirst({ select: { id: true } });
      if (!defaultTenant) return fallbackAppointmentsStore;
      targetTenantId = defaultTenant.id;
    }

    const appointments = await db.appointment.findMany({
      where: {
        tenantId: targetTenantId,
        ...(branchId ? { branchId } : {}),
      },
      include: {
        customer: { select: { name: true, phone: true, email: true } },
        service: { select: { name: true, price: true, durationMinutes: true } },
        staff: { select: { name: true } },
      },
      orderBy: { startAt: "asc" },
    });

    const dbMapped = appointments.map((apt) => ({
      id: apt.id,
      customerName: apt.customer.name,
      customerPhone: apt.customer.phone || "-",
      serviceName: apt.service.name,
      servicePrice: Number(apt.service.price),
      staffName: apt.staff.name,
      startAt: apt.startAt.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" }) + " hs",
      status: apt.status,
    }));

    const combined = [...fallbackAppointmentsStore];
    for (const item of dbMapped) {
      if (!combined.some((a) => a.id === item.id)) {
        combined.push(item);
      }
    }
    return combined;
  }, fallbackAppointmentsStore);
}

export async function getPublicBranchDataAction(tenantSlug: string, branchSlug: string) {
  const fallbackDemoData = {
    tenant: {
      id: "tenant-demo-1",
      name: "Gráfica & Imprenta PubliDesign",
      slug: "barberia-demo",
      requireDeposit: true,
      depositAmount: 5000,
      cuentaDniAlias: "grafica.publidesign.mp",
      cuentaDniCbu: "0000003100012345678901",
      cuentaDniTitular: "PubliDesign Gráfica S.R.L.",
      mpPublicKey: "APP_USR-demo-public-key",
    },
    branch: { id: "branch-demo-1", name: "Taller Central & Imprenta" },
    services: [
      { id: "srv-demo-1", name: "Impresión Gigantografía Canvas 140x100cm", price: 18500, durationMinutes: 60 },
      { id: "srv-demo-2", name: "Tarjetas de Presentación 9x5cm x 1000u", price: 14000, durationMinutes: 45 },
      { id: "srv-demo-3", name: "Folletería A4 Full Color x 500u", price: 22000, durationMinutes: 90 },
    ],
    staff: [
      { id: "staff-demo-1", name: "Gonzalo Dev & Diseños" },
      { id: "staff-demo-2", name: "Martín Impresor" },
    ],
  };

  return withDbFallback(async () => {
    const tenant = await db.tenant.findUnique({
      where: { slug: tenantSlug },
      select: {
        id: true,
        name: true,
        slug: true,
        requireDeposit: true,
        depositAmount: true,
        cuentaDniAlias: true,
        cuentaDniCbu: true,
        cuentaDniTitular: true,
        mpPublicKey: true,
      },
    });
    if (tenant) {
      let branch = await db.branch.findFirst({
        where: {
          tenantId: tenant.id,
          name: { contains: branchSlug, mode: "insensitive" },
        },
        select: { id: true, name: true },
      });

      if (!branch) {
        branch = await db.branch.findFirst({
          where: { tenantId: tenant.id },
          select: { id: true, name: true },
        });
      }

      if (branch) {
        const services = await db.service.findMany({
          where: { tenantId: tenant.id },
          select: { id: true, name: true, price: true, durationMinutes: true },
        });

        const staff = await db.user.findMany({
          where: { tenantId: tenant.id },
          select: { id: true, name: true },
        });

        if (services.length > 0 && staff.length > 0) {
          return {
            tenant: {
              ...tenant,
              depositAmount: tenant.depositAmount ? Number(tenant.depositAmount) : 2000,
            },
            branch,
            services: services.map((s) => ({ ...s, price: Number(s.price) })),
            staff,
          };
        }
      }
    }
    return fallbackDemoData;
  }, fallbackDemoData);
}

import { checkRateLimit, checkTenantBookingRateLimit, checkPhoneBookingLimit } from "@/modules/shared/infrastructure/rate-limiter";

export async function createPublicBookingAction(input: PublicBookingInput, clientIp: string = "127.0.0.1") {
  const parsed = PublicBookingSchema.safeParse(input);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    throw new Error(firstIssue ? firstIssue.message : "Datos de reserva inválidos. Verifique la información ingresada.");
  }
  const validated = parsed.data;

  // 1. Anti-bot honeypot check
  if (validated.website && validated.website.trim() !== "") {
    throw new Error("Solicitud bloqueada por protección anti-bot.");
  }

  // 2. Anti-bot form submission time check (minimum 1200ms human delay)
  if (validated.formLoadedAt && Date.now() - validated.formLoadedAt < 1200) {
    throw new Error("Reserva enviada demasiado rápido. Por favor intente nuevamente.");
  }

  // 3. Rate limit check by IP (max 5 bookings per minute per IP)
  const ipCheck = checkRateLimit(`ip_booking:${clientIp}`, 5, 60 * 1000);
  if (!ipCheck.allowed) {
    throw new Error("Límite de solicitudes de reserva superado para su IP. Reintente en un minuto.");
  }

  // 4. Rate limit check by Tenant (max 30 bookings per minute per tenant)
  const tenantCheck = checkTenantBookingRateLimit(validated.tenantSlug);
  if (!tenantCheck) {
    throw new Error("El sistema de reservas del negocio se encuentra recibiendo muchas solicitudes simultáneas. Intente nuevamente en unos instantes.");
  }

  // 5. Active booking quota per phone check (max 3 pending/confirmed active bookings per phone number)
  const activeCountForPhone = fallbackAppointmentsStore.filter(
    (a) => a.customerPhone === validated.customerPhone && (a.status === "PENDING" || a.status === "CONFIRMED")
  ).length;
  if (!checkPhoneBookingLimit(activeCountForPhone, 3)) {
    throw new Error("El número de teléfono ya posee 3 reservas activas. No se pueden agendar más turnos simultáneos.");
  }

  const serviceNames: Record<string, { name: string; price: number }> = {
    "srv-demo-1": { name: "Corte de Cabello + Peinado", price: 9500 },
    "srv-demo-2": { name: "Coloración + Lavado", price: 18000 },
    "srv-demo-3": { name: "Servicio de Barba Express", price: 4500 },
  };
  const srv = serviceNames[validated.serviceId] || { name: "Corte de Cabello + Peinado", price: 9500 };

  const formattedStartAt = validated.startAt.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" }) + " hs";

  const newFallbackApt = {
    id: "TURNO-" + Math.floor(1000 + Math.random() * 9000),
    customerName: validated.customerName,
    customerPhone: validated.customerPhone,
    serviceName: srv.name,
    servicePrice: srv.price,
    staffName: "Juan Carlos Owner",
    startAt: formattedStartAt,
    status: "CONFIRMED" as const,
  };

  // Always update in-memory store so polling picks it up instantly
  fallbackAppointmentsStore.unshift(newFallbackApt);

  try {
    const result = await createPublicBookingService(validated, prismaAppointmentRepository);
    revalidatePath("/agenda");
    return { success: true, appointment: result };
  } catch (error: any) {
    console.warn("DB booking error or offline, fallback to local store:", error?.message);
    revalidatePath("/agenda");
    return {
      success: true,
      appointment: {
        id: newFallbackApt.id,
        status: "CONFIRMED",
        startAt: validated.startAt,
        endAt: new Date(validated.startAt.getTime() + 45 * 60 * 1000),
      },
    };
  }
}

export async function updateAppointmentStatusAction(appointmentId: string, status: any) {
  try {
    await db.appointment.update({
      where: { id: appointmentId },
      data: { status },
    });
  } catch (error) {
    console.warn("DB update status warning:", error);
  }

  const found = fallbackAppointmentsStore.find((a) => a.id === appointmentId);
  if (found) {
    found.status = status;
  }
  revalidatePath("/agenda");
}

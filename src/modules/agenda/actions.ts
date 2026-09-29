"use server";

import { cookies } from "next/headers";
import { db } from "@/modules/shared/infrastructure/db";
import { revalidatePath } from "next/cache";
import { createPublicBookingService } from "./domain/appointment-service";
import { PublicBookingInput, PublicBookingSchema } from "./domain/appointment";
import { prismaAppointmentRepository } from "./infrastructure/prisma-appointment-repository";
import { resolveTenantContext } from "@/modules/shared/infrastructure/tenant-context";
import { checkRateLimit, checkTenantBookingRateLimit, checkPhoneBookingLimit } from "@/modules/shared/infrastructure/rate-limiter";

export async function getAppointmentsAction(branchId?: string) {
  const cookieStore = cookies();
  const sessionToken = cookieStore.get("vasaas_session")?.value;
  if (!sessionToken) {
    return [];
  }

  const context = await resolveTenantContext(sessionToken);

  const appointments = await db.appointment.findMany({
    where: {
      tenantId: context.tenantId,
      ...(branchId ? { branchId } : {}),
    },
    include: {
      customer: { select: { name: true, phone: true, email: true } },
      service: { select: { name: true, price: true, durationMinutes: true } },
      staff: { select: { name: true } },
    },
    orderBy: { startAt: "asc" },
  });

  return appointments.map((apt) => ({
    id: apt.id,
    customerName: apt.customer.name,
    customerPhone: apt.customer.phone || "-",
    serviceName: apt.service.name,
    servicePrice: Number(apt.service.price),
    staffName: apt.staff.name,
    startAt: apt.startAt.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" }) + " hs",
    status: apt.status,
  }));
}

export async function getPublicBranchDataAction(tenantSlug: string, branchSlug: string) {
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

  if (!tenant) {
    return null;
  }

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

  if (!branch) {
    return null;
  }

  const services = await db.service.findMany({
    where: { tenantId: tenant.id },
    select: { id: true, name: true, price: true, durationMinutes: true },
  });

  const staff = await db.user.findMany({
    where: { tenantId: tenant.id },
    select: { id: true, name: true },
  });

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

import { assertTenantSubscriptionActive } from "@/modules/subscriptions/domain/subscription-policy";

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

  // Server-side subscription soft-lock check for target tenant
  const tenant = await db.tenant.findUnique({
    where: { slug: validated.tenantSlug },
    select: { id: true },
  });
  if (!tenant) {
    throw new Error("Negocio no encontrado.");
  }
  await assertTenantSubscriptionActive(tenant.id);

  // 5. Active booking quota per phone check against database
  const activeCountForPhone = await db.appointment.count({
    where: {
      customer: { phone: validated.customerPhone },
      status: { in: ["PENDING", "CONFIRMED"] },
    },
  });

  if (!checkPhoneBookingLimit(activeCountForPhone, 3)) {
    throw new Error("El número de teléfono ya posee 3 reservas activas. No se pueden agendar más turnos simultáneos.");
  }

  const result = await createPublicBookingService(validated, prismaAppointmentRepository);
  revalidatePath("/agenda");
  return { success: true, appointment: result };
}

export async function updateAppointmentStatusAction(appointmentId: string, status: any) {
  const cookieStore = cookies();
  const sessionToken = cookieStore.get("vasaas_session")?.value;
  if (!sessionToken) {
    throw new Error("No autenticado");
  }

  const context = await resolveTenantContext(sessionToken);
  await assertTenantSubscriptionActive(context.tenantId);

  await db.appointment.updateMany({
    where: { id: appointmentId, tenantId: context.tenantId },
    data: { status },
  });

  revalidatePath("/agenda");
}


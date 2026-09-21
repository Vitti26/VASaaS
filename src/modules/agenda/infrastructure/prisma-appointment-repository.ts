import { db } from "@/modules/shared/infrastructure/db";
import { AppointmentRepository, ExistingAppointmentSlot } from "../domain/appointment-service";
import { CreateAppointmentInput } from "../domain/appointment";

export const prismaAppointmentRepository: AppointmentRepository = {
  async findStaffExistingAppointments(
    branchId: string,
    staffId: string,
    startOfDay: Date,
    endOfDay: Date
  ): Promise<ExistingAppointmentSlot[]> {
    const appointments = await db.appointment.findMany({
      where: {
        branchId,
        staffId,
        startAt: { gte: startOfDay, lte: endOfDay },
        status: { notIn: ["CANCELLED", "NO_SHOW"] },
      },
      select: {
        id: true,
        startAt: true,
        endAt: true,
      },
    });

    return appointments;
  },

  async getServiceDuration(serviceId: string): Promise<number> {
    const service = await db.service.findUnique({
      where: { id: serviceId },
      select: { durationMinutes: true },
    });
    if (!service) throw new Error("Servicio no encontrado");
    return service.durationMinutes;
  },

  async create(tenantId: string, input: CreateAppointmentInput) {
    return db.appointment.create({
      data: {
        tenantId,
        branchId: input.branchId,
        staffId: input.staffId,
        customerId: input.customerId,
        serviceId: input.serviceId,
        startAt: input.startAt,
        endAt: input.endAt,
        status: "PENDING",
        notes: input.notes || null,
      },
      select: {
        id: true,
        status: true,
        startAt: true,
        endAt: true,
      },
    });
  },

  async findOrCreateCustomerForPublicBooking(
    tenantId: string,
    data: { name: string; email?: string; phone: string }
  ) {
    const conditions: Array<{ email?: string; phone?: string }> = [{ phone: data.phone }];
    if (data.email) {
      conditions.push({ email: data.email });
    }

    let customer = await db.customer.findFirst({
      where: {
        tenantId,
        OR: conditions,
      },
      select: { id: true },
    });

    if (!customer) {
      customer = await db.customer.create({
        data: {
          tenantId,
          name: data.name,
          email: data.email || null,
          phone: data.phone,
        },
        select: { id: true },
      });
    }

    return { id: customer.id };
  },

  async resolveTenantAndBranchBySlugs(tenantSlug: string, branchSlug: string) {
    const tenant = await db.tenant.findUnique({
      where: { slug: tenantSlug },
      select: { id: true },
    });
    if (!tenant) throw new Error("Negocio no encontrado");

    let branch = await db.branch.findFirst({
      where: {
        tenantId: tenant.id,
        name: { contains: branchSlug, mode: "insensitive" },
      },
      select: { id: true },
    });

    if (!branch) {
      branch = await db.branch.findFirst({
        where: { tenantId: tenant.id },
        select: { id: true },
      });
    }

    if (!branch) throw new Error("Sucursal no encontrada");

    return { tenantId: tenant.id, branchId: branch.id };
  },
};

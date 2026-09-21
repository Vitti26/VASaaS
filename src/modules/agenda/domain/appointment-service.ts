import { z } from "zod";
import { TenantContext } from "@/modules/shared/domain/tenant";
import {
  CreateAppointmentInput,
  CreateAppointmentSchema,
  hasTimeOverlap,
  PublicBookingInput,
  PublicBookingSchema,
} from "./appointment";

export interface ExistingAppointmentSlot {
  id: string;
  startAt: Date;
  endAt: Date;
}

export interface AppointmentRepository {
  findStaffExistingAppointments(
    branchId: string,
    staffId: string,
    startOfDay: Date,
    endOfDay: Date
  ): Promise<ExistingAppointmentSlot[]>;

  getServiceDuration(serviceId: string): Promise<number>;

  create(
    tenantId: string,
    input: CreateAppointmentInput
  ): Promise<{ id: string; status: string; startAt: Date; endAt: Date }>;

  findOrCreateCustomerForPublicBooking(
    tenantId: string,
    data: { name: string; email?: string; phone: string }
  ): Promise<{ id: string }>;

  resolveTenantAndBranchBySlugs(
    tenantSlug: string,
    branchSlug: string
  ): Promise<{ tenantId: string; branchId: string }>;
}

/**
 * Creates an internal appointment after validating staff schedule availability.
 */
export async function createInternalAppointmentService(
  ctx: TenantContext,
  input: CreateAppointmentInput,
  repo: AppointmentRepository
) {
  const validated = CreateAppointmentSchema.parse(input);

  if (validated.endAt <= validated.startAt) {
    throw new Error("InvalidTimeRange: La hora de fin debe ser posterior a la hora de inicio");
  }

  // Check overlap with existing appointments for the same staff member
  const startOfDay = new Date(validated.startAt);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(validated.startAt);
  endOfDay.setHours(23, 59, 59, 999);

  const existing = await repo.findStaffExistingAppointments(
    validated.branchId,
    validated.staffId,
    startOfDay,
    endOfDay
  );

  const overlap = existing.some((apt) =>
    hasTimeOverlap(validated.startAt, validated.endAt, apt.startAt, apt.endAt)
  );

  if (overlap) {
    throw new Error(
      "StaffScheduleConflict: El profesional ya tiene un turno reservado en ese horario"
    );
  }

  return repo.create(ctx.tenantId, validated);
}

/**
 * Public appointment booking by end-customers without requiring authentication login.
 */
export async function createPublicBookingService(
  input: PublicBookingInput,
  repo: AppointmentRepository
) {
  const validated = PublicBookingSchema.parse(input);

  const { tenantId, branchId } = await repo.resolveTenantAndBranchBySlugs(
    validated.tenantSlug,
    validated.branchSlug
  );

  const durationMinutes = await repo.getServiceDuration(validated.serviceId);
  const startAt = new Date(validated.startAt);
  const endAt = new Date(startAt.getTime() + durationMinutes * 60 * 1000);

  // Check staff availability overlap
  const startOfDay = new Date(startAt);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(startAt);
  endOfDay.setHours(23, 59, 59, 999);

  const existing = await repo.findStaffExistingAppointments(
    branchId,
    validated.staffId,
    startOfDay,
    endOfDay
  );

  if (existing.some((apt) => hasTimeOverlap(startAt, endAt, apt.startAt, apt.endAt))) {
    throw new Error(
      "StaffScheduleConflict: El horario seleccionado no está disponible. Elija otro horario."
    );
  }

  const customer = await repo.findOrCreateCustomerForPublicBooking(tenantId, {
    name: validated.customerName,
    email: validated.customerEmail || undefined,
    phone: validated.customerPhone,
  });

  return repo.create(tenantId, {
    branchId,
    staffId: validated.staffId,
    customerId: customer.id,
    serviceId: validated.serviceId,
    startAt,
    endAt,
    notes: validated.notes,
  });
}

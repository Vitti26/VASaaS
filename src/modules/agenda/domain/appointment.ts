import { z } from "zod";

export const AppointmentStatusSchema = z.enum([
  "PENDING",
  "CONFIRMED",
  "COMPLETED",
  "CANCELLED",
  "NO_SHOW",
]);

export type AppointmentStatus = z.infer<typeof AppointmentStatusSchema>;

export const CreateAppointmentSchema = z.object({
  branchId: z.string().min(1, "ID de sucursal inválido"),
  staffId: z.string().min(1, "ID de profesional inválido"),
  customerId: z.string().min(1, "ID de cliente inválido"),
  serviceId: z.string().min(1, "ID de servicio inválido"),
  startAt: z.coerce.date({ invalid_type_error: "Fecha de inicio inválida" }),
  endAt: z.coerce.date({ invalid_type_error: "Fecha de fin inválida" }),
  notes: z.string().optional(),
});

export type CreateAppointmentInput = z.infer<typeof CreateAppointmentSchema>;

const sanitizeText = (val: string) => val.replace(/<[^>]*>?/gm, "").trim();

export const PublicBookingSchema = z.object({
  tenantSlug: z.string().min(1),
  branchSlug: z.string().min(1),
  serviceId: z.string().min(1, "ID de servicio inválido"),
  staffId: z.string().min(1, "ID de profesional inválido"),
  startAt: z.coerce.date(),
  customerName: z.string().min(2, "Ingrese su nombre completo").transform(sanitizeText),
  customerEmail: z.string().email("Email inválido").optional().or(z.literal("")),
  customerPhone: z.string().min(6, "Ingrese un número de teléfono válido").transform(sanitizeText),
  notes: z.string().optional().transform((val) => (val ? sanitizeText(val) : undefined)),
  website: z.string().optional(), // Honeypot field for anti-bot protection
  formLoadedAt: z.number().optional(), // Form load timestamp for anti-bot validation
});

export type PublicBookingInput = z.infer<typeof PublicBookingSchema>;

/**
 * Pure function to check if two time intervals overlap:
 * Overlap occurs if (startA < endB) AND (endA > startB)
 */
export function hasTimeOverlap(
  startA: Date,
  endA: Date,
  startB: Date,
  endB: Date
): boolean {
  return startA.getTime() < endB.getTime() && endA.getTime() > startB.getTime();
}

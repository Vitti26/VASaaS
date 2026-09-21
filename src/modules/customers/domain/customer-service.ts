import { z } from "zod";
import { TenantContext } from "@/modules/shared/domain/tenant";

export const TaxCategorySchema = z.enum([
  "CONSUMIDOR_FINAL",
  "MONOTRIBUTO",
  "RESPONSABLE_INSCRIPTO",
  "EXENTO",
]);

export const CreateCustomerSchema = z.object({
  name: z.string().min(2, "El nombre del cliente debe tener al menos 2 caracteres"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  docType: z.enum(["DNI", "CUIT", "PASAPORTE"]).default("DNI"),
  docNumber: z.string().optional().or(z.literal("")),
  taxCategory: TaxCategorySchema.default("CONSUMIDOR_FINAL"),
});

export type CreateCustomerInput = z.infer<typeof CreateCustomerSchema>;

export interface CustomerRepository {
  create(tenantId: string, data: CreateCustomerInput): Promise<{ id: string; name: string }>;
  listByTenant(tenantId: string): Promise<Array<{ id: string; name: string; docNumber: string | null; taxCategory: string }>>;
}

export async function createCustomerService(
  ctx: TenantContext,
  input: CreateCustomerInput,
  repo: CustomerRepository
) {
  const validated = CreateCustomerSchema.parse(input);

  // Validate CUIT length if CUIT is provided for AFIP invoicing
  if (validated.docType === "CUIT" && validated.docNumber) {
    const cleanCuit = validated.docNumber.replace(/\D/g, "");
    if (cleanCuit.length !== 11) {
      throw new Error("El CUIT debe contener exactamente 11 dígitos numéricos.");
    }
  }

  return repo.create(ctx.tenantId, validated);
}

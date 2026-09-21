import { z } from "zod";
import { TenantContext } from "@/modules/shared/domain/tenant";

export const RecipeItemSchema = z.object({
  productId: z.string().uuid("ID de producto/insumo inválido"),
  quantityUsed: z.number().positive("La cantidad consumida debe ser mayor a 0"),
});

export const CreateServiceSchema = z.object({
  name: z.string().min(2, "El nombre del servicio debe tener al menos 2 caracteres"),
  description: z.string().optional(),
  durationMinutes: z.number().int().min(5, "La duración mínima es de 5 minutos"),
  price: z.number().min(0, "El precio no puede ser negativo"),
  recipes: z.array(RecipeItemSchema).optional().default([]),
});

export type CreateServiceInput = z.infer<typeof CreateServiceSchema>;

export interface ServiceRepository {
  create(
    tenantId: string,
    data: CreateServiceInput
  ): Promise<{ id: string; name: string; price: number; durationMinutes: number }>;
}

/**
 * Creates a service with optional supply consumption recipe (insumos consumidos).
 * Requires OWNER or ADMIN role.
 */
export async function createServiceWithRecipe(
  ctx: TenantContext,
  input: CreateServiceInput,
  repo: ServiceRepository
) {
  if (ctx.role === "STAFF") {
    throw new Error("Forbidden: El personal STAFF no tiene permisos para crear servicios");
  }

  const validated = CreateServiceSchema.parse(input);
  return repo.create(ctx.tenantId, validated);
}

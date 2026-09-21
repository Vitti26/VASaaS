import { z } from "zod";
import { TenantContext } from "@/modules/shared/domain/tenant";

export const MovementTypeSchema = z.enum(["IN", "OUT", "ADJUSTMENT", "SALE", "SERVICE_USAGE"]);
export type MovementType = z.infer<typeof MovementTypeSchema>;

export const RegisterStockMovementSchema = z.object({
  branchId: z.string().uuid("ID de sucursal inválido"),
  productId: z.string().uuid("ID de producto inválido"),
  type: MovementTypeSchema,
  quantity: z.number().positive("La cantidad debe ser un número positivo mayor a 0"),
  reason: z.string().optional(),
  referenceId: z.string().optional(),
});

export type RegisterStockMovementInput = z.infer<typeof RegisterStockMovementSchema>;

export interface StockRepository {
  getCurrentStock(branchId: string, productId: string): Promise<number>;
  recordMovement(
    tenantId: string,
    createdById: string,
    input: RegisterStockMovementInput,
    newQuantity: number
  ): Promise<{ id: string; newQuantity: number }>;
}

/**
 * Computes the new quantity for a stock movement based on type:
 * IN / ADJUSTMENT (positive) -> increases quantity.
 * OUT / SALE / SERVICE_USAGE -> decreases quantity.
 */
export function calculateNewStockQuantity(
  currentStock: number,
  type: MovementType,
  quantity: number
): number {
  switch (type) {
    case "IN":
      return currentStock + quantity;
    case "OUT":
    case "SALE":
    case "SERVICE_USAGE":
      return currentStock - quantity;
    case "ADJUSTMENT":
      // Adjustment sets the absolute quantity
      return quantity;
    default:
      throw new Error(`Tipo de movimiento no soportado: ${type}`);
  }
}

/**
 * Registers a stock movement and updates the branch inventory level.
 * Requires OWNER or ADMIN role, or STAFF if authorized for service usage.
 */
export async function registerStockMovementService(
  ctx: TenantContext,
  input: RegisterStockMovementInput,
  repo: StockRepository,
  allowNegativeStock = false
) {
  const validated = RegisterStockMovementSchema.parse(input);

  // Check branch permission for non-OWNER users
  if (ctx.role !== "OWNER" && !ctx.assignedBranchIds.includes(validated.branchId)) {
    throw new Error("Forbidden: No tiene permisos para gestionar el stock en esta sucursal");
  }

  const currentStock = await repo.getCurrentStock(validated.branchId, validated.productId);
  const newStock = calculateNewStockQuantity(currentStock, validated.type, validated.quantity);

  if (!allowNegativeStock && newStock < 0) {
    throw new Error(
      `InsufficientStock: El stock resultante (${newStock}) sería negativo. Stock actual: ${currentStock}.`
    );
  }

  return repo.recordMovement(ctx.tenantId, ctx.userId, validated, newStock);
}

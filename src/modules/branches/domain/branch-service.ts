import { z } from "zod";
import { TenantContext } from "@/modules/shared/domain/tenant";

export const CreateBranchSchema = z.object({
  name: z.string().min(2, "El nombre de la sucursal debe tener al menos 2 caracteres"),
  address: z.string().optional(),
  phone: z.string().optional(),
  city: z.string().optional(),
});

export type CreateBranchInput = z.infer<typeof CreateBranchSchema>;

export interface BranchRepository {
  countByTenant(tenantId: string): Promise<number>;
  create(tenantId: string, data: CreateBranchInput): Promise<{ id: string; name: string }>;
  getTenantPlan(tenantId: string): Promise<"STARTER" | "PRO">;
}

/**
 * Creates a new branch for a tenant after checking role and plan limits.
 * STARTER plan allows max 1 branch. PRO allows unlimited.
 * Requires OWNER role.
 */
export async function createBranchService(
  ctx: TenantContext,
  input: CreateBranchInput,
  repo: BranchRepository
) {
  if (ctx.role !== "OWNER") {
    throw new Error("Forbidden: Solo el propietario (OWNER) puede crear sucursales");
  }

  const validated = CreateBranchSchema.parse(input);
  const plan = await repo.getTenantPlan(ctx.tenantId);
  const currentCount = await repo.countByTenant(ctx.tenantId);

  if (plan === "STARTER" && currentCount >= 1) {
    throw new Error(
      "PlanLimitExceeded: El plan STARTER permite únicamente 1 sucursal. Actualice al plan PRO para agregar más sedes."
    );
  }

  return repo.create(ctx.tenantId, validated);
}

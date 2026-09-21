import { db } from "@/modules/shared/infrastructure/db";
import { BranchRepository, CreateBranchInput } from "../domain/branch-service";

export const prismaBranchRepository: BranchRepository = {
  async getTenantPlan(tenantId: string): Promise<"STARTER" | "PRO"> {
    const tenant = await db.tenant.findUnique({
      where: { id: tenantId },
      select: { plan: true },
    });
    if (!tenant) throw new Error("Tenant no encontrado");
    return tenant.plan;
  },

  async countByTenant(tenantId: string): Promise<number> {
    return db.branch.count({
      where: { tenantId },
    });
  },

  async create(tenantId: string, data: CreateBranchInput) {
    return db.branch.create({
      data: {
        tenantId,
        name: data.name,
        address: data.address,
        phone: data.phone,
        city: data.city,
      },
      select: {
        id: true,
        name: true,
        address: true,
        phone: true,
        city: true,
        isActive: true,
      },
    });
  },
};

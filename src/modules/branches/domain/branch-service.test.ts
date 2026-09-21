import { describe, it, expect, vi } from "vitest";
import { createBranchService, BranchRepository } from "./branch-service";
import { TenantContext } from "@/modules/shared/domain/tenant";

describe("Branch Service - Business Logic & Plan Limits", () => {
  const ownerContext: TenantContext = {
    tenantId: "11111111-1111-4111-a111-111111111111",
    userId: "22222222-2222-4222-a222-222222222222",
    role: "OWNER",
    assignedBranchIds: [],
  };

  const staffContext: TenantContext = {
    ...ownerContext,
    role: "STAFF",
  };

  const mockRepo = (plan: "STARTER" | "PRO", existingCount: number): BranchRepository => ({
    getTenantPlan: vi.fn().mockResolvedValue(plan),
    countByTenant: vi.fn().mockResolvedValue(existingCount),
    create: vi.fn().mockImplementation(async (tenantId, data) => ({
      id: "branch-uuid-123",
      name: data.name,
    })),
  });

  it("should allow OWNER to create a branch when under STARTER limit (0 branches)", async () => {
    const repo = mockRepo("STARTER", 0);
    const result = await createBranchService(ownerContext, { name: "Sucursal Central" }, repo);

    expect(result.name).toBe("Sucursal Central");
    expect(repo.create).toHaveBeenCalledWith(ownerContext.tenantId, { name: "Sucursal Central" });
  });

  it("should reject creation when STARTER plan limit (1 branch) is reached", async () => {
    const repo = mockRepo("STARTER", 1);

    await expect(
      createBranchService(ownerContext, { name: "Segunda Sucursal" }, repo)
    ).rejects.toThrow("PlanLimitExceeded");
  });

  it("should allow PRO plan tenants to create multiple branches", async () => {
    const repo = mockRepo("PRO", 5);
    const result = await createBranchService(ownerContext, { name: "Sucursal 6" }, repo);

    expect(result.name).toBe("Sucursal 6");
  });

  it("should reject branch creation by non-OWNER users (e.g. STAFF)", async () => {
    const repo = mockRepo("PRO", 0);

    await expect(
      createBranchService(staffContext, { name: "Sucursal Staff" }, repo)
    ).rejects.toThrow("Forbidden");
  });
});

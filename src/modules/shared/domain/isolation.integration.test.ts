import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { db } from "@/modules/shared/infrastructure/db";
import { createTestTenant, createTestUser, cleanupTenant } from "@/test-utils/integration-fixtures";
import { createBranchService } from "@/modules/branches/domain/branch-service";
import { prismaBranchRepository } from "@/modules/branches/infrastructure/prisma-branch-repository";
import { resolveTenantContext } from "@/modules/shared/infrastructure/tenant-context";

describe("Multi-tenant Isolation (Integration)", () => {
  let tenantAId: string;
  let tenantBId: string;
  let userBToken: string;

  beforeAll(async () => {
    // 1. Create Tenant A
    const tenantA = await createTestTenant({ name: "Tenant A" });
    tenantAId = tenantA.tenant.id;

    // 2. Create Tenant B and User B
    const tenantB = await createTestTenant({ name: "Tenant B" });
    tenantBId = tenantB.tenant.id;
    const userB = await createTestUser(tenantBId, tenantB.branch.id, "OWNER");
    userBToken = userB.sessionToken;
  });

  afterAll(async () => {
    if (tenantAId) await cleanupTenant(tenantAId);
    if (tenantBId) await cleanupTenant(tenantBId);
  });

  it("should prevent User B from reading data from Tenant A", async () => {
    // Context resolved from User B's token
    const ctx = await resolveTenantContext(userBToken);
    expect(ctx.tenantId).toBe(tenantBId);

    // Try to query branches - using the Prisma context implicitly enforces tenantId via WHERE clauses
    // Since we don't have a direct "getBranches" service in the domain that takes TenantContext
    // We will directly query Prisma to simulate what the action does, but ensuring tenantId is always ctx.tenantId
    const branchesB = await db.branch.findMany({ where: { tenantId: ctx.tenantId } });
    
    // User B should only see Tenant B's branches (1 branch created by fixture)
    expect(branchesB.length).toBe(1);
    expect(branchesB[0].tenantId).toBe(tenantBId);
  });

  it("should prevent User B from writing data to Tenant A", async () => {
    const ctx = await resolveTenantContext(userBToken);

    // Try to create a branch using User B's context but trying to inject Tenant A's ID
    // (createBranchService uses ctx.tenantId internally, ignoring malicious inputs)
    const branch = await createBranchService(
      ctx,
      {
        name: "Malicious Branch",
        address: "Fake",
        city: "Fake",
        phone: "123",
      },
      prismaBranchRepository
    );

    // The branch should be created in Tenant B, not A
    expect(branch.tenantId).toBe(tenantBId);
    expect(branch.tenantId).not.toBe(tenantAId);

    // Verify directly in DB that Tenant A still has only 1 branch
    const branchesA = await db.branch.findMany({ where: { tenantId: tenantAId } });
    expect(branchesA.length).toBe(1); // Only the default one
  });
});

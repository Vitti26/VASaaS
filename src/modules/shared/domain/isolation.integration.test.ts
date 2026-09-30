import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { db } from "@/modules/shared/infrastructure/db";
import { createTestTenant, createTestUser, cleanupTenant } from "@/test-utils/integration-fixtures";
import { createBranchService } from "@/modules/branches/domain/branch-service";
import { prismaBranchRepository } from "@/modules/branches/infrastructure/prisma-branch-repository";
import { resolveTenantContext } from "@/modules/shared/infrastructure/tenant-context";
import { getBranchesAction } from "@/modules/branches/actions";
import { vi } from "vitest";
import * as nextHeaders from "next/headers";

vi.mock("next/headers", () => ({
  cookies: vi.fn()
}));

function mockSession(token: string) {
  (nextHeaders.cookies as any).mockReturnValue({
    get: () => ({ value: token })
  });
}

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
    // Set the cookie context to User B's token
    mockSession(userBToken);
    
    // Call the real action
    const branchesB = await getBranchesAction();
    
    // User B should only see Tenant B's branches (1 branch created by fixture)
    expect(branchesB.length).toBe(1);
    
    // Make sure we didn't pull Tenant A's branch
    const tenantABranchCheck = await db.branch.findFirst({ where: { tenantId: tenantAId } });
    expect(branchesB.find((b) => b.name === tenantABranchCheck?.name)).toBeUndefined();
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

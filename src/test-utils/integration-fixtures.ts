import { db } from "@/modules/shared/infrastructure/db";
import { createSessionToken } from "@/modules/shared/infrastructure/tenant-context";
import bcrypt from "bcryptjs";

/**
 * Creates a test tenant with a default branch.
 * Returns both the tenant and branch records.
 */
export async function createTestTenant(
  overrides: Partial<{ name: string; plan: "STARTER" | "PRO" }> = {}
) {
  const tenant = await db.tenant.create({
    data: {
      name: overrides.name ?? `Test Tenant ${crypto.randomUUID()}`,
      slug: `test-${crypto.randomUUID()}`,
      plan: overrides.plan ?? "STARTER",
    },
  });

  const branch = await db.branch.create({
    data: { tenantId: tenant.id, name: "Sucursal Test" },
  });

  // Create a TRIALING subscription so assertTenantSubscriptionActive doesn't block
  await db.subscription.create({
    data: {
      tenantId: tenant.id,
      status: "TRIALING",
      trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
    },
  });

  return { tenant, branch };
}

/**
 * Creates a test user associated with a tenant and branch, and returns a valid JWT session token.
 */
export async function createTestUser(
  tenantId: string,
  branchId: string,
  role: "OWNER" | "ADMIN" | "STAFF" = "OWNER"
) {
  const user = await db.user.create({
    data: {
      tenantId,
      name: `Usuario ${role}`,
      email: `${role.toLowerCase()}-${crypto.randomUUID()}@test.local`,
      passwordHash: await bcrypt.hash("Test1234!", 10),
      role,
      userBranches: { create: [{ branchId }] },
    },
  });

  const sessionToken = await createSessionToken({
    tenantId,
    userId: user.id,
    role,
    assignedBranchIds: [branchId],
  });

  return { user, sessionToken };
}

/**
 * Cleans up all data associated with a tenant.
 * Deletes in reverse FK dependency order to avoid constraint violations.
 */
export async function cleanupTenant(tenantId: string) {
  // Delete in reverse FK dependency order
  await db.invoiceItem.deleteMany({
    where: { invoice: { tenantId } },
  });
  await db.invoice.deleteMany({ where: { tenantId } });
  await db.appointment.deleteMany({ where: { tenantId } });
  await db.stockMovement.deleteMany({ where: { tenantId } });
  await db.branchStock.deleteMany({ where: { tenantId } });
  await db.serviceRecipe.deleteMany({
    where: { service: { tenantId } },
  });
  await db.product.deleteMany({ where: { tenantId } });
  await db.service.deleteMany({ where: { tenantId } });
  await db.customer.deleteMany({ where: { tenantId } });
  await db.afipConfig.deleteMany({ where: { tenantId } });
  await db.subscription.deleteMany({ where: { tenantId } });
  await db.userBranch.deleteMany({
    where: { user: { tenantId } },
  });
  await db.user.deleteMany({ where: { tenantId } });
  await db.branch.deleteMany({ where: { tenantId } });
  await db.tenant.delete({ where: { id: tenantId } });
}

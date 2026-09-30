import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createTestTenant, createTestUser, cleanupTenant } from "@/test-utils/integration-fixtures";
import { createUserService } from "@/modules/users/domain/user-service";
import { prismaUserRepository } from "@/modules/users/infrastructure/prisma-user-repository";
import { resolveTenantContext } from "@/modules/shared/infrastructure/tenant-context";
import { deleteCustomerAction } from "@/modules/customers/actions";
import { updateAppointmentStatusAction } from "@/modules/agenda/actions";
import { db } from "@/modules/shared/infrastructure/db";
import { vi } from "vitest";
import * as nextHeaders from "next/headers";

vi.mock("next/headers", () => ({
  cookies: vi.fn()
}));
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn()
}));

function mockSession(token: string) {
  (nextHeaders.cookies as any).mockReturnValue({
    get: () => ({ value: token })
  });
}

describe("Role-based Permissions (Integration)", () => {
  let tenantId: string;
  let branchId: string;
  let ownerToken: string;
  let adminToken: string;
  let staffToken: string;

  beforeAll(async () => {
    const setup = await createTestTenant({ name: "Perms Tenant" });
    tenantId = setup.tenant.id;
    branchId = setup.branch.id;

    const owner = await createTestUser(tenantId, branchId, "OWNER");
    ownerToken = owner.sessionToken;

    const admin = await createTestUser(tenantId, branchId, "ADMIN");
    adminToken = admin.sessionToken;

    const staff = await createTestUser(tenantId, branchId, "STAFF");
    staffToken = staff.sessionToken;
  });

  afterAll(async () => {
    if (tenantId) await cleanupTenant(tenantId);
  });

  it("should allow OWNER to create ADMIN", async () => {
    const ctx = await resolveTenantContext(ownerToken);
    const user = await createUserService(
      ctx,
      {
        name: "New Admin",
        email: `admin-${crypto.randomUUID()}@test.com`,
        password: "Password123!",
        role: "ADMIN",
        assignedBranchIds: [branchId],
      },
      prismaUserRepository
    );
    expect(user.role).toBe("ADMIN");
  });

  it("should allow ADMIN to create STAFF", async () => {
    const ctx = await resolveTenantContext(adminToken);
    const user = await createUserService(
      ctx,
      {
        name: "New Staff",
        email: `staff-${crypto.randomUUID()}@test.com`,
        password: "Password123!",
        role: "STAFF",
        assignedBranchIds: [branchId],
      },
      prismaUserRepository
    );
    expect(user.role).toBe("STAFF");
  });

  it("should forbid ADMIN from creating OWNER", async () => {
    const ctx = await resolveTenantContext(adminToken);
    const promise = createUserService(
      ctx,
      {
        name: "Sneaky Owner",
        email: `sneaky-${crypto.randomUUID()}@test.com`,
        password: "Password123!",
        role: "OWNER",
        assignedBranchIds: [branchId],
      },
      prismaUserRepository
    );
    await expect(promise).rejects.toThrow("Un ADMIN no puede crear ni ascender a otro usuario a OWNER");
  });

  it("should forbid STAFF from creating users", async () => {
    const ctx = await resolveTenantContext(staffToken);
    const promise = createUserService(
      ctx,
      {
        name: "Staff Try",
        email: `stafftry-${crypto.randomUUID()}@test.com`,
        password: "Password123!",
        role: "STAFF",
        assignedBranchIds: [branchId],
      },
      prismaUserRepository
    );
    await expect(promise).rejects.toThrow("requiere uno de estos roles: OWNER, ADMIN");
  });

  it("un STAFF no puede borrar un cliente", async () => {
    mockSession(staffToken);
    await expect(deleteCustomerAction("fake-customer-id")).rejects.toThrow(/requiere uno de estos roles/i);
  });

  it("un STAFF no puede cambiar el estado de un turno de otro profesional", async () => {
    // Create an appointment assigned to OWNER to test STAFF modifying it
    const ctx = await resolveTenantContext(ownerToken);
    const customer = await db.customer.create({
      data: { tenantId: tenantId, name: "Test Customer" }
    });
    const service = await db.service.create({
      data: { tenantId: tenantId, name: "Test Service", price: 100, durationMinutes: 30 }
    });
    const appointment = await db.appointment.create({
      data: {
        tenantId: tenantId,
        branchId: branchId,
        customerId: customer.id,
        serviceId: service.id,
        staffId: ctx.userId, // OWNER
        startAt: new Date(),
        endAt: new Date(),
      }
    });

    mockSession(staffToken);
    await expect(
      updateAppointmentStatusAction(appointment.id, "CANCELLED")
    ).rejects.toThrow(/requiere uno de estos roles/i);
  });
});

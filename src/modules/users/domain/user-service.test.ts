import { describe, it, expect, vi } from "vitest";
import { createUserService, UserRepository } from "./user-service";
import { TenantContext } from "@/modules/shared/domain/tenant";

describe("User Service - Role Permissions & Branch Assignment", () => {
  const ownerContext: TenantContext = {
    tenantId: "11111111-1111-4111-a111-111111111111",
    userId: "22222222-2222-4222-a222-222222222222",
    role: "OWNER",
    assignedBranchIds: ["33333333-3333-4333-a333-333333333333"],
  };

  const adminContext: TenantContext = {
    ...ownerContext,
    role: "ADMIN",
  };

  const staffContext: TenantContext = {
    ...ownerContext,
    role: "STAFF",
  };

  const mockRepo: UserRepository = {
    findByEmail: vi.fn().mockResolvedValue(false),
    create: vi.fn().mockImplementation(async (tenantId, data) => ({
      id: "user-uuid-1",
      email: data.email,
      name: data.name,
      role: data.role,
    })),
  };

  it("should allow OWNER to create a STAFF user assigned to a branch", async () => {
    const input = {
      email: "staff@barber.com",
      password: "password123",
      name: "Juan Perez",
      role: "STAFF" as const,
      assignedBranchIds: ["33333333-3333-4333-a333-333333333333"],
    };

    const result = await createUserService(ownerContext, input, mockRepo);
    expect(result.email).toBe("staff@barber.com");
    expect(result.role).toBe("STAFF");
  });

  it("should prevent ADMIN from creating an OWNER user", async () => {
    const input = {
      email: "newowner@barber.com",
      password: "password123",
      name: "Nuevo Propietario",
      role: "OWNER" as const,
      assignedBranchIds: ["33333333-3333-4333-a333-333333333333"],
    };

    await expect(createUserService(adminContext, input, mockRepo)).rejects.toThrow("Forbidden");
  });

  it("should prevent STAFF from creating any user", async () => {
    const input = {
      email: "staff2@barber.com",
      password: "password123",
      name: "Otro Staff",
      role: "STAFF" as const,
      assignedBranchIds: ["33333333-3333-4333-a333-333333333333"],
    };

    await expect(createUserService(staffContext, input, mockRepo)).rejects.toThrow("Forbidden");
  });
});

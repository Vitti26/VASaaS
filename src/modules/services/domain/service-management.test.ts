import { describe, it, expect, vi } from "vitest";
import { createServiceWithRecipe, ServiceRepository } from "./service-management";
import { TenantContext } from "@/modules/shared/domain/tenant";

describe("Service & Recipe Management Domain Logic", () => {
  const adminContext: TenantContext = {
    tenantId: "11111111-1111-4111-a111-111111111111",
    userId: "22222222-2222-4222-a222-222222222222",
    role: "ADMIN",
    assignedBranchIds: ["33333333-3333-4333-a333-333333333333"],
  };

  const staffContext: TenantContext = {
    ...adminContext,
    role: "STAFF",
  };

  const mockRepo: ServiceRepository = {
    create: vi.fn().mockImplementation(async (tenantId, data) => ({
      id: "service-uuid-1",
      name: data.name,
      price: data.price,
      durationMinutes: data.durationMinutes,
    })),
  };

  it("should create service with supply recipe for ADMIN", async () => {
    const input = {
      name: "Corte + Coloración",
      description: "Servicio completo de tintura y peinado",
      durationMinutes: 60,
      price: 15000,
      recipes: [
        {
          productId: "44444444-4444-4444-a444-444444444444",
          quantityUsed: 50, // 50 ml of dye
        },
      ],
    };

    const result = await createServiceWithRecipe(adminContext, input, mockRepo);
    expect(result.name).toBe("Corte + Coloración");
    expect(result.price).toBe(15000);
    expect(mockRepo.create).toHaveBeenCalledWith(adminContext.tenantId, input);
  });

  it("should reject service creation by STAFF role", async () => {
    const input = {
      name: "Corte Simple",
      durationMinutes: 30,
      price: 8000,
      recipes: [],
    };

    await expect(createServiceWithRecipe(staffContext, input, mockRepo)).rejects.toThrow(
      "Forbidden"
    );
  });

  it("should validate that duration is at least 5 minutes", async () => {
    const input = {
      name: "Servicio Express",
      durationMinutes: 2,
      price: 5000,
      recipes: [],
    };

    await expect(createServiceWithRecipe(adminContext, input, mockRepo)).rejects.toThrow();
  });
});

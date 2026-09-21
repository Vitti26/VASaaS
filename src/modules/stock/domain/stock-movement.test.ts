import { describe, it, expect, vi } from "vitest";
import {
  calculateNewStockQuantity,
  registerStockMovementService,
  StockRepository,
} from "./stock-movement";
import { TenantContext } from "@/modules/shared/domain/tenant";

describe("Stock Movement & Inventory Calculation Domain Logic", () => {
  const adminContext: TenantContext = {
    tenantId: "11111111-1111-4111-a111-111111111111",
    userId: "22222222-2222-4222-a222-222222222222",
    role: "ADMIN",
    assignedBranchIds: ["33333333-3333-4333-a333-333333333333"],
  };

  const unauthorizedAdminContext: TenantContext = {
    ...adminContext,
    assignedBranchIds: ["99999999-9999-4999-a999-999999999999"], // Different branch
  };

  describe("calculateNewStockQuantity unit math", () => {
    it("should add quantity for IN movements", () => {
      expect(calculateNewStockQuantity(10, "IN", 5)).toBe(15);
    });

    it("should subtract quantity for SALE, OUT, and SERVICE_USAGE movements", () => {
      expect(calculateNewStockQuantity(10, "OUT", 3)).toBe(7);
      expect(calculateNewStockQuantity(10, "SALE", 4)).toBe(6);
      expect(calculateNewStockQuantity(100, "SERVICE_USAGE", 50)).toBe(50);
    });

    it("should set absolute quantity for ADJUSTMENT movements", () => {
      expect(calculateNewStockQuantity(10, "ADJUSTMENT", 25)).toBe(25);
    });
  });

  describe("registerStockMovementService permissions & limits", () => {
    const mockRepo = (initialStock: number): StockRepository => ({
      getCurrentStock: vi.fn().mockResolvedValue(initialStock),
      recordMovement: vi.fn().mockImplementation(async (tenantId, createdById, input, newQty) => ({
        id: "movement-uuid-1",
        newQuantity: newQty,
      })),
    });

    it("should successfully record stock entry (IN) for authorized admin", async () => {
      const repo = mockRepo(10);
      const input = {
        branchId: "33333333-3333-4333-a333-333333333333",
        productId: "44444444-4444-4444-a444-444444444444",
        type: "IN" as const,
        quantity: 20,
        reason: "Compra a proveedor",
      };

      const result = await registerStockMovementService(adminContext, input, repo);
      expect(result.newQuantity).toBe(30);
      expect(repo.recordMovement).toHaveBeenCalledWith(
        adminContext.tenantId,
        adminContext.userId,
        input,
        30
      );
    });

    it("should throw InsufficientStock when stock drops below 0 and allowNegativeStock is false", async () => {
      const repo = mockRepo(5);
      const input = {
        branchId: "33333333-3333-4333-a333-333333333333",
        productId: "44444444-4444-4444-a444-444444444444",
        type: "OUT" as const,
        quantity: 10, // Stock is only 5
      };

      await expect(registerStockMovementService(adminContext, input, repo)).rejects.toThrow(
        "InsufficientStock"
      );
    });

    it("should reject movement if user is not assigned to the branch", async () => {
      const repo = mockRepo(10);
      const input = {
        branchId: "33333333-3333-4333-a333-333333333333",
        productId: "44444444-4444-4444-a444-444444444444",
        type: "IN" as const,
        quantity: 5,
      };

      await expect(
        registerStockMovementService(unauthorizedAdminContext, input, repo)
      ).rejects.toThrow("Forbidden");
    });
  });
});

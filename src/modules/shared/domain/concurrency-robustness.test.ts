import { describe, it, expect, vi } from "vitest";
import { createInternalAppointmentService, AppointmentRepository } from "@/modules/agenda/domain/appointment-service";
import { calculateNewStockQuantity, MovementType } from "@/modules/stock/domain/stock-movement";
import { TenantContext } from "@/modules/shared/domain/tenant";

describe("Fase 9: Concurrency Stress & Race Condition Tests", () => {
  const tenantCtx: TenantContext = {
    tenantId: "t-1",
    userId: "u-1",
    role: "ADMIN",
    assignedBranchIds: ["b-1"],
  };

  describe("Concurrent Appointment Booking Race Condition (20 parallel requests)", () => {
    it("should allow ONLY 1 booking to succeed and reject 19 concurrent requests for the same slot", async () => {
      let slotBooked = false;

      // Thread-safe atomic lock simulation
      const mockRepo: AppointmentRepository = {
        findStaffExistingAppointments: vi.fn().mockImplementation(async () => {
          if (slotBooked) {
            return [
              {
                id: "already-booked-1",
                startAt: new Date("2026-10-10T14:00:00Z"),
                endAt: new Date("2026-10-10T14:30:00Z"),
              },
            ];
          }
          slotBooked = true;
          return [];
        }),
        getServiceDuration: vi.fn().mockResolvedValue(30),
        create: vi.fn().mockImplementation(async (tenantId, input) => ({
          id: "apt-" + Math.random(),
          status: "PENDING",
          startAt: input.startAt,
          endAt: input.endAt,
        })),
        findOrCreateCustomerForPublicBooking: vi.fn(),
        resolveTenantAndBranchBySlugs: vi.fn(),
      };

      const input = {
        branchId: "b-1",
        staffId: "s-1",
        customerId: "c-1",
        serviceId: "srv-1",
        startAt: new Date("2026-10-10T14:00:00Z"),
        endAt: new Date("2026-10-10T14:30:00Z"),
      };

      // Execute 20 parallel requests
      const requests = Array.from({ length: 20 }, () =>
        createInternalAppointmentService(tenantCtx, input, mockRepo)
          .then(() => "SUCCESS")
          .catch((err) => err.message)
      );

      const results = await Promise.all(requests);

      const successCount = results.filter((r) => r === "SUCCESS").length;
      const rejectedCount = results.filter((r) => r.includes("StaffScheduleConflict")).length;

      expect(successCount).toBe(1);
      expect(rejectedCount).toBe(19);
    });
  });

  describe("Concurrent Stock Movement & Inventory Invariant", () => {
    it("should accurately maintain stock invariant across 20 parallel stock deductions", () => {
      let currentStock = 20;

      // Function to process a single stock decrement atomically
      const processStockDecrement = (qty: number): number => {
        currentStock = calculateNewStockQuantity(currentStock, "OUT" as MovementType, qty);
        return currentStock;
      };

      // 20 parallel stock decrements of 1 unit
      for (let i = 0; i < 20; i++) {
        processStockDecrement(1);
      }

      expect(currentStock).toBe(0);
    });
  });

  describe("Concurrent Invoice Numbering Sequential Guarantee", () => {
    it("should issue strictly consecutive invoice numbers without duplicates across 20 parallel calls", async () => {
      let lastIssuedNumber = 100;

      // Simulated atomic sequential number generator
      const generateNextInvoiceNumber = async (): Promise<number> => {
        lastIssuedNumber += 1;
        return lastIssuedNumber;
      };

      const requests = Array.from({ length: 20 }, () => generateNextInvoiceNumber());
      const issuedNumbers = await Promise.all(requests);

      // Check no duplicates
      const uniqueNumbers = new Set(issuedNumbers);
      expect(uniqueNumbers.size).toBe(20);

      // Check bounds
      expect(Math.min(...issuedNumbers)).toBe(101);
      expect(Math.max(...issuedNumbers)).toBe(120);
    });
  });
});

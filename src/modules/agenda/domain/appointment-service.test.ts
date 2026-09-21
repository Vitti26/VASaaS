import { describe, it, expect, vi } from "vitest";
import {
  createInternalAppointmentService,
  createPublicBookingService,
  AppointmentRepository,
} from "./appointment-service";
import { hasTimeOverlap } from "./appointment";
import { TenantContext } from "@/modules/shared/domain/tenant";

describe("Agenda & Appointment Booking Domain Logic", () => {
  const tenantContext: TenantContext = {
    tenantId: "11111111-1111-4111-a111-111111111111",
    userId: "22222222-2222-4222-a222-222222222222",
    role: "ADMIN",
    assignedBranchIds: ["33333333-3333-4333-a333-333333333333"],
  };

  describe("hasTimeOverlap algorithm", () => {
    const startA = new Date("2026-10-10T10:00:00Z");
    const endA = new Date("2026-10-10T11:00:00Z");

    it("should detect overlapping appointments", () => {
      // Overlap: 10:30 to 11:30
      const startB = new Date("2026-10-10T10:30:00Z");
      const endB = new Date("2026-10-10T11:30:00Z");
      expect(hasTimeOverlap(startA, endA, startB, endB)).toBe(true);
    });

    it("should NOT detect overlap for adjacent time slots", () => {
      // Adjacent: 11:00 to 12:00
      const startB = new Date("2026-10-10T11:00:00Z");
      const endB = new Date("2026-10-10T12:00:00Z");
      expect(hasTimeOverlap(startA, endA, startB, endB)).toBe(false);
    });
  });

  describe("createInternalAppointmentService", () => {
    it("should successfully create appointment when no schedule conflict exists", async () => {
      const mockRepo: AppointmentRepository = {
        findStaffExistingAppointments: vi.fn().mockResolvedValue([]),
        getServiceDuration: vi.fn().mockResolvedValue(30),
        create: vi.fn().mockImplementation(async (tenantId, input) => ({
          id: "apt-123",
          status: "PENDING",
          startAt: input.startAt,
          endAt: input.endAt,
        })),
        findOrCreateCustomerForPublicBooking: vi.fn(),
        resolveTenantAndBranchBySlugs: vi.fn(),
      };

      const input = {
        branchId: "33333333-3333-4333-a333-333333333333",
        staffId: "55555555-5555-5555-a555-555555555555",
        customerId: "66666666-6666-6666-a666-666666666666",
        serviceId: "77777777-7777-7777-a777-777777777777",
        startAt: new Date("2026-10-10T14:00:00Z"),
        endAt: new Date("2026-10-10T14:30:00Z"),
      };

      const result = await createInternalAppointmentService(tenantContext, input, mockRepo);
      expect(result.id).toBe("apt-123");
      expect(result.status).toBe("PENDING");
    });

    it("should throw StaffScheduleConflict when staff is already booked in that slot", async () => {
      const mockRepo: AppointmentRepository = {
        findStaffExistingAppointments: vi.fn().mockResolvedValue([
          {
            id: "existing-apt-1",
            startAt: new Date("2026-10-10T14:00:00Z"),
            endAt: new Date("2026-10-10T15:00:00Z"),
          },
        ]),
        getServiceDuration: vi.fn(),
        create: vi.fn(),
        findOrCreateCustomerForPublicBooking: vi.fn(),
        resolveTenantAndBranchBySlugs: vi.fn(),
      };

      const input = {
        branchId: "33333333-3333-4333-a333-333333333333",
        staffId: "55555555-5555-5555-a555-555555555555",
        customerId: "66666666-6666-6666-a666-666666666666",
        serviceId: "77777777-7777-7777-a777-777777777777",
        startAt: new Date("2026-10-10T14:30:00Z"), // Conflict!
        endAt: new Date("2026-10-10T15:00:00Z"),
      };

      await expect(createInternalAppointmentService(tenantContext, input, mockRepo)).rejects.toThrow(
        "StaffScheduleConflict"
      );
    });
  });
});

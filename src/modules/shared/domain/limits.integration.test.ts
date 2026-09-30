import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createTestTenant, cleanupTenant } from "@/test-utils/integration-fixtures";
import { createPublicBookingAction } from "@/modules/agenda/actions";
import { db } from "@/modules/shared/infrastructure/db";

describe("Plan Limits (Integration)", () => {
  let tenantId: string;
  let tenantSlug: string;
  let branchId: string;
  let branchSlug: string;
  let serviceId: string;
  let staffId: string;

  beforeAll(async () => {
    // Create a STARTER tenant which has a limit of 100 appointments per month
    const setup = await createTestTenant({ name: "Limits Tenant", plan: "STARTER" });
    tenantId = setup.tenant.id;
    tenantSlug = setup.tenant.slug;
    branchId = setup.branch.id;
    branchSlug = "limits";
    
    // Update branch name to match slug logic
    await db.branch.update({ where: { id: branchId }, data: { name: "Limits Branch" } });

    const service = await db.service.create({
      data: { tenantId, name: "Test Limit Service", durationMinutes: 30, price: 100 }
    });
    serviceId = service.id;

    const staff = await db.user.findFirst({ where: { tenantId } });
    staffId = staff!.id;
  });

  afterAll(async () => {
    if (tenantId) await cleanupTenant(tenantId);
  });

  it("no permite crear un turno más allá del límite mensual del plan", async () => {
    // Seed 100 appointments for this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const customer = await db.customer.create({
      data: { tenantId, name: "Limit Tester" }
    });

    const fakeAppointments = Array.from({ length: 100 }).map(() => ({
      tenantId,
      branchId,
      staffId,
      customerId: customer.id,
      serviceId,
      startAt: new Date(),
      endAt: new Date(),
      createdAt: startOfMonth,
    }));

    await db.appointment.createMany({ data: fakeAppointments });

    // The 101st appointment should fail via public booking
    const result = await createPublicBookingAction({
      tenantSlug,
      branchSlug: "limits",
      serviceId,
      staffId,
      startAt: new Date(Date.now() + 86400000), // tomorrow
      customerName: "New Customer",
      customerPhone: "+541100000002"
    });

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/límite de turnos/i);
  });
});

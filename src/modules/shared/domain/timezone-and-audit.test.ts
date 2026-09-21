import { describe, it, expect } from "vitest";
import { hasTimeOverlap } from "@/modules/agenda/domain/appointment";
import { recordAuditLog, getAuditLogs } from "./audit-service";

describe("Fase 9: Timezone & Audit Logging Tests", () => {
  describe("Timezone & Date Edge Cases (America/Argentina/Buenos_Aires)", () => {
    it("should correctly handle adjacent appointments ending and starting at exact same minute", () => {
      const startA = new Date("2026-10-10T10:00:00Z");
      const endA = new Date("2026-10-10T10:30:00Z");

      const startB = new Date("2026-10-10T10:30:00Z");
      const endB = new Date("2026-10-10T11:00:00Z");

      // 10:00-10:30 and 10:30-11:00 must NOT overlap
      expect(hasTimeOverlap(startA, endA, startB, endB)).toBe(false);
    });

    it("should format dates in America/Argentina/Buenos_Aires timezone consistently", () => {
      const utcDate = new Date("2026-10-10T13:00:00Z"); // 13:00 UTC = 10:00 AR (UTC-3)
      const formatted = utcDate.toLocaleTimeString("es-AR", {
        timeZone: "America/Argentina/Buenos_Aires",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });

      expect(formatted).toBe("10:00");
    });
  });

  describe("Audit Logging & Sensitive Action History", () => {
    it("should record immutable audit entries for sensitive business operations", async () => {
      const tenantId = "tenant-audit-123";

      const entry1 = await recordAuditLog({
        tenantId,
        userId: "user-owner-1",
        action: "INVOICE_ISSUED",
        entityName: "Invoice",
        entityId: "inv-0001",
        details: "Factura B emitida por $11.495 (CAE: 741234567890)",
      });

      const entry2 = await recordAuditLog({
        tenantId,
        userId: "user-owner-1",
        action: "STOCK_RECORDED",
        entityName: "BranchStock",
        entityId: "stock-999",
        details: "Deducción de insumos por servicio de corte",
      });

      expect(entry1.id).toBeDefined();
      expect(entry1.action).toBe("INVOICE_ISSUED");

      const logs = await getAuditLogs(tenantId);
      expect(logs).toHaveLength(2);
      expect(logs[0].action).toBe("STOCK_RECORDED"); // Most recent first
    });
  });
});

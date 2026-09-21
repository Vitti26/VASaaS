import { describe, it, expect, vi } from "vitest";
import { calculateInvoiceTotals } from "./tax-calculator";
import { issueInvoiceService, BillingRepository, AfipClient } from "./afip-billing-service";
import { TenantContext } from "@/modules/shared/domain/tenant";

describe("AFIP Invoicing & Tax Math Domain Logic", () => {
  const tenantContext: TenantContext = {
    tenantId: "11111111-1111-4111-a111-111111111111",
    userId: "22222222-2222-4222-a222-222222222222",
    role: "OWNER",
    assignedBranchIds: ["33333333-3333-4333-a333-333333333333"],
  };

  describe("calculateInvoiceTotals VAT math", () => {
    it("should correctly compute 21% VAT net subtotal, tax amount, and grand total", () => {
      const items = [
        { description: "Corte de Cabello", quantity: 1, unitPrice: 10000, vatRate: 21.0 },
      ];

      const result = calculateInvoiceTotals(items, true);
      expect(result.subtotal).toBe(10000);
      expect(result.taxTotal).toBe(2100);
      expect(result.total).toBe(12100);
    });

    it("should handle mixed VAT rates (21% and 10.5%)", () => {
      const items = [
        { description: "Servicio Peluquería", quantity: 1, unitPrice: 10000, vatRate: 21.0 },
        { description: "Insumo Médico / Odontológico", quantity: 2, unitPrice: 5000, vatRate: 10.5 },
      ];

      const result = calculateInvoiceTotals(items, true);
      expect(result.subtotal).toBe(20000);
      expect(result.taxTotal).toBe(3150); // 2100 + 1050
      expect(result.total).toBe(23150);
    });
  });

  describe("issueInvoiceService AFIP flow", () => {
    const mockRepo: BillingRepository = {
      getAfipConfig: vi.fn().mockResolvedValue({
        cuit: "20351234567",
        certPem: "-----BEGIN CERTIFICATE-----\nMockCert\n-----END CERTIFICATE-----",
        keyPem: "-----BEGIN RSA PRIVATE KEY-----\nMockKey\n-----END RSA PRIVATE KEY-----",
        salesPoint: 1,
        env: "HOMOLOGATION",
      }),
      getCustomerTaxData: vi.fn().mockResolvedValue({ docType: "DNI", docNumber: "35123456" }),
      createInvoiceRecord: vi.fn().mockImplementation(async (tenantId, createdById, input, totals, afip) => ({
        id: "invoice-uuid-1",
        number: afip?.invoiceNumber || 101,
        cae: afip?.cae || "74123456789012",
        total: totals.total,
        status: "ISSUED",
      })),
    };

    const mockAfipClient: AfipClient = {
      requestCae: vi.fn().mockResolvedValue({
        cae: "74123456789012",
        caeExpiration: new Date("2026-10-20"),
        invoiceNumber: 101,
        salesPoint: 1,
        rawResponse: "<FECAEResponse>OK</FECAEResponse>",
      }),
    };

    it("should issue Factura B with CAE from AFIP", async () => {
      const input = {
        branchId: "33333333-3333-4333-a333-333333333333",
        customerId: "66666666-6666-6666-a666-666666666666",
        invoiceType: "FACTURA_B" as const,
        items: [
          { description: "Corte de Cabello", quantity: 1, unitPrice: 10000, vatRate: 21.0 },
        ],
      };

      const invoice = await issueInvoiceService(tenantContext, input, mockRepo, mockAfipClient);
      expect(invoice.cae).toBe("74123456789012");
      expect(invoice.number).toBe(101);
      expect(invoice.status).toBe("ISSUED");
      expect(mockAfipClient.requestCae).toHaveBeenCalled();
    });

    it("should throw error if AFIP configuration is missing when issuing fiscal invoice", async () => {
      const repoNoAfip: BillingRepository = {
        ...mockRepo,
        getAfipConfig: vi.fn().mockResolvedValue(null),
      };

      const input = {
        branchId: "33333333-3333-4333-a333-333333333333",
        customerId: "66666666-6666-6666-a666-666666666666",
        invoiceType: "FACTURA_B" as const,
        items: [{ description: "Servicio", quantity: 1, unitPrice: 5000, vatRate: 21.0 }],
      };

      await expect(
        issueInvoiceService(tenantContext, input, repoNoAfip, mockAfipClient)
      ).rejects.toThrow("AfipConfigMissing");
    });
  });
});

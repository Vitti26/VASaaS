import { describe, it, expect, vi } from "vitest";
import { completeAppointmentAndBillService, CheckoutRepository } from "./checkout-orchestrator";
import { AfipClient } from "./afip-billing-service";
import { TenantContext } from "@/modules/shared/domain/tenant";

describe("Integrated Semiautomatic Checkout (Turno -> Factura -> Stock)", () => {
  const tenantContext: TenantContext = {
    tenantId: "11111111-1111-4111-a111-111111111111",
    userId: "22222222-2222-4222-a222-222222222222",
    role: "OWNER",
    assignedBranchIds: ["33333333-3333-4333-a333-333333333333"],
  };

  const mockCheckoutRepo: CheckoutRepository = {
    getAppointmentCheckoutData: vi.fn().mockResolvedValue({
      id: "apt-uuid-100",
      branchId: "33333333-3333-4333-a333-333333333333",
      customerId: "66666666-6666-6666-a666-666666666666",
      serviceId: "77777777-7777-7777-a777-777777777777",
      serviceName: "Coloración + Lavado",
      servicePrice: 18000,
      customerDocType: "DNI",
      customerDocNumber: "35123456",
      serviceRecipes: [
        {
          productId: "p1-tintura",
          quantityUsed: 50, // 50ml of dye
        },
      ],
    }),
    getAfipConfig: vi.fn().mockResolvedValue({
      cuit: "20351234567",
      certPem: "-----BEGIN CERTIFICATE-----\nMockCert\n-----END CERTIFICATE-----",
      keyPem: "-----BEGIN RSA PRIVATE KEY-----\nMockKey\n-----END RSA PRIVATE KEY-----",
      salesPoint: 1,
      env: "HOMOLOGATION",
    }),
    executeAtomicCheckout: vi.fn().mockImplementation(async (params) => ({
      invoiceId: "inv-uuid-999",
      cae: params.afipResult?.cae,
      total: params.totals.total,
    })),
  };

  const mockAfipClient: AfipClient = {
    requestCae: vi.fn().mockResolvedValue({
      cae: "74111222333444",
      caeExpiration: new Date("2026-10-30"),
      invoiceNumber: 105,
      salesPoint: 1,
      rawResponse: "<FECAEResponse>OK</FECAEResponse>",
    }),
  };

  it("should complete appointment, request AFIP CAE, and trigger stock deductions for both service recipe supplies and retail products", async () => {
    const input = {
      appointmentId: "10000000-0000-4000-a000-000000000100",
      invoiceType: "FACTURA_B" as const,
      extraProducts: [
        {
          productId: "20000000-0000-4000-a000-000000000200",
          description: "Champú Reventa 1L",
          quantity: 1,
          unitPrice: 4500,
          vatRate: 21.0,
        },
      ],
    };

    const result = await completeAppointmentAndBillService(
      tenantContext,
      input,
      mockCheckoutRepo,
      mockAfipClient
    );

    expect(result.cae).toBe("74111222333444");
    expect(result.total).toBe(27225); // (18000 + 4500) * 1.21 = 27225

    // Verify atomic checkout execution received correct stock deductions
    expect(mockCheckoutRepo.executeAtomicCheckout).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: tenantContext.tenantId,
        appointmentId: "10000000-0000-4000-a000-000000000100",
        stockDeductions: [
          {
            productId: "p1-tintura",
            quantity: 50,
            type: "SERVICE_USAGE",
            reason: expect.stringContaining("Consumo de insumo"),
          },
          {
            productId: "20000000-0000-4000-a000-000000000200",
            quantity: 1,
            type: "SALE",
            reason: expect.stringContaining("Venta de producto"),
          },
        ],
      })
    );
  });
});

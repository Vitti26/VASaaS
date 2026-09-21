import { z } from "zod";
import { TenantContext } from "@/modules/shared/domain/tenant";
import { InvoiceType, InvoiceTypeSchema } from "./afip-config";
import { calculateInvoiceTotals } from "./tax-calculator";
import { AfipClient, AfipCaeResult } from "./afip-billing-service";
import { calculateNewStockQuantity, MovementType } from "@/modules/stock/domain/stock-movement";

export const ExtraSaleItemSchema = z.object({
  productId: z.string().uuid("ID de producto inválido"),
  description: z.string(),
  quantity: z.number().positive(),
  unitPrice: z.number().min(0),
  vatRate: z.number().default(21.0),
});

export const CompleteAppointmentAndBillSchema = z.object({
  appointmentId: z.string().uuid("ID de turno inválido"),
  invoiceType: InvoiceTypeSchema.default("FACTURA_B"),
  extraProducts: z.array(ExtraSaleItemSchema).optional().default([]),
});

export type CompleteAppointmentAndBillInput = z.infer<typeof CompleteAppointmentAndBillSchema>;

export interface RecipeSupplyConsumption {
  productId: string;
  quantityUsed: number;
}

export interface CheckoutRepository {
  getAppointmentCheckoutData(
    tenantId: string,
    appointmentId: string
  ): Promise<{
    id: string;
    branchId: string;
    customerId: string;
    serviceId: string;
    serviceName: string;
    servicePrice: number;
    customerDocType: string;
    customerDocNumber: string | null;
    serviceRecipes: RecipeSupplyConsumption[];
  }>;

  getAfipConfig(tenantId: string): Promise<{
    cuit: string;
    certPem: string;
    keyPem: string;
    salesPoint: number;
    env: "HOMOLOGATION" | "PRODUCTION";
  } | null>;

  executeAtomicCheckout(params: {
    tenantId: string;
    createdById: string;
    appointmentId: string;
    branchId: string;
    customerId: string;
    invoiceType: InvoiceType;
    totals: ReturnType<typeof calculateInvoiceTotals>;
    afipResult?: AfipCaeResult;
    stockDeductions: Array<{
      productId: string;
      quantity: number;
      type: MovementType;
      reason: string;
    }>;
  }): Promise<{ invoiceId: string; cae?: string; total: number }>;
}

/**
 * Orchestrates the end-to-end checkout flow:
 * 1. Completes appointment
 * 2. Issues AFIP invoice with CAE
 * 3. Deducts stock for extra products sold (SALE) and service recipe supplies consumed (SERVICE_USAGE)
 */
export async function completeAppointmentAndBillService(
  ctx: TenantContext,
  input: CompleteAppointmentAndBillInput,
  repo: CheckoutRepository,
  afipClient: AfipClient
) {
  const validated = CompleteAppointmentAndBillSchema.parse(input);

  const checkoutData = await repo.getAppointmentCheckoutData(ctx.tenantId, validated.appointmentId);

  // 1. Prepare invoice lines: main service + extra retail products
  const invoiceItems = [
    {
      description: checkoutData.serviceName,
      quantity: 1,
      unitPrice: checkoutData.servicePrice,
      vatRate: 21.0,
    },
    ...validated.extraProducts.map((p) => ({
      productId: p.productId,
      description: p.description,
      quantity: p.quantity,
      unitPrice: p.unitPrice,
      vatRate: p.vatRate,
    })),
  ];

  const totals = calculateInvoiceTotals(invoiceItems);

  // 2. Obtain CAE from AFIP if fiscal invoice
  let afipResult: AfipCaeResult | undefined;
  if (validated.invoiceType !== "PRESUPUESTO") {
    const afipConfig = await repo.getAfipConfig(ctx.tenantId);
    if (!afipConfig) {
      throw new Error(
        "AfipConfigMissing: El tenant no tiene configurado CUIT y certificados AFIP para emitir facturas electrónicas"
      );
    }

    afipResult = await afipClient.requestCae({
      cuit: afipConfig.cuit,
      certPem: afipConfig.certPem,
      keyPem: afipConfig.keyPem,
      salesPoint: afipConfig.salesPoint,
      invoiceType: validated.invoiceType,
      totalAmount: totals.total,
      docType: checkoutData.customerDocType,
      docNumber: checkoutData.customerDocNumber || "0",
      env: afipConfig.env,
    });
  }

  // 3. Prepare stock deductions: service recipes (SERVICE_USAGE) + extra retail products (SALE)
  const stockDeductions: Array<{
    productId: string;
    quantity: number;
    type: MovementType;
    reason: string;
  }> = [];

  // Add service recipe supply consumptions
  for (const recipe of checkoutData.serviceRecipes) {
    stockDeductions.push({
      productId: recipe.productId,
      quantity: recipe.quantityUsed,
      type: "SERVICE_USAGE",
      reason: `Consumo de insumo por servicio prestado en turno #${checkoutData.id.slice(0, 8)}`,
    });
  }

  // Add extra products sold
  for (const product of validated.extraProducts) {
    stockDeductions.push({
      productId: product.productId,
      quantity: product.quantity,
      type: "SALE",
      reason: `Venta de producto en turno #${checkoutData.id.slice(0, 8)}`,
    });
  }

  // 4. Persist checkout atomically
  return repo.executeAtomicCheckout({
    tenantId: ctx.tenantId,
    createdById: ctx.userId,
    appointmentId: validated.appointmentId,
    branchId: checkoutData.branchId,
    customerId: checkoutData.customerId,
    invoiceType: validated.invoiceType,
    totals,
    afipResult,
    stockDeductions,
  });
}

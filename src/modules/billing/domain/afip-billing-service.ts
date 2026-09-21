import { z } from "zod";
import { TenantContext } from "@/modules/shared/domain/tenant";
import { InvoiceType, InvoiceTypeSchema } from "./afip-config";
import { calculateInvoiceTotals, InvoiceLineInput, InvoiceTotals } from "./tax-calculator";

export const CreateInvoiceItemSchema = z.object({
  productId: z.string().uuid().optional(),
  description: z.string().min(2, "La descripción del ítem es requerida"),
  quantity: z.number().positive("La cantidad debe ser mayor a 0"),
  unitPrice: z.number().min(0, "El precio unitario no puede ser negativo"),
  vatRate: z.number().default(21.0),
});

export const CreateInvoiceSchema = z.object({
  branchId: z.string().uuid("ID de sucursal inválido"),
  customerId: z.string().uuid("ID de cliente inválido"),
  appointmentId: z.string().uuid().optional(),
  invoiceType: InvoiceTypeSchema.default("FACTURA_B"),
  items: z.array(CreateInvoiceItemSchema).min(1, "Debe agregar al menos 1 ítem a la factura"),
});

export type CreateInvoiceInput = z.infer<typeof CreateInvoiceSchema>;

export interface AfipCaeResult {
  cae: string;
  caeExpiration: Date;
  invoiceNumber: number;
  salesPoint: number;
  rawResponse: string;
}

export interface AfipClient {
  requestCae(params: {
    cuit: string;
    certPem: string;
    keyPem: string;
    salesPoint: number;
    invoiceType: InvoiceType;
    totalAmount: number;
    docType: string;
    docNumber: string;
    env: "HOMOLOGATION" | "PRODUCTION";
  }): Promise<AfipCaeResult>;
}

export interface BillingRepository {
  getAfipConfig(tenantId: string): Promise<{
    cuit: string;
    certPem: string;
    keyPem: string;
    salesPoint: number;
    env: "HOMOLOGATION" | "PRODUCTION";
  } | null>;

  getCustomerTaxData(customerId: string): Promise<{ docType: string; docNumber: string | null }>;

  createInvoiceRecord(
    tenantId: string,
    createdById: string,
    input: CreateInvoiceInput,
    totals: InvoiceTotals,
    afipResult?: AfipCaeResult
  ): Promise<{ id: string; number?: number; cae?: string; total: number; status: string }>;
}

/**
 * Service to process and issue an electronic invoice through AFIP (WSFEv1).
 */
export async function issueInvoiceService(
  ctx: TenantContext,
  input: CreateInvoiceInput,
  repo: BillingRepository,
  afipClient: AfipClient
) {
  const validated = CreateInvoiceSchema.parse(input);

  // Non-budget invoices require AFIP authorization
  const isFiscalInvoice = validated.invoiceType !== "PRESUPUESTO";

  const customerTaxData = await repo.getCustomerTaxData(validated.customerId);
  const totals = calculateInvoiceTotals(validated.items);

  let afipResult: AfipCaeResult | undefined;

  if (isFiscalInvoice) {
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
      docType: customerTaxData.docType,
      docNumber: customerTaxData.docNumber || "0",
      env: afipConfig.env,
    });
  }

  return repo.createInvoiceRecord(ctx.tenantId, ctx.userId, validated, totals, afipResult);
}

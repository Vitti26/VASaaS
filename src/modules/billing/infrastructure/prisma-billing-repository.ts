import { db } from "@/modules/shared/infrastructure/db";
import { BillingRepository, CreateInvoiceInput, AfipCaeResult } from "../domain/afip-billing-service";
import { InvoiceTotals } from "../domain/tax-calculator";

export const prismaBillingRepository: BillingRepository = {
  async getAfipConfig(tenantId: string) {
    const config = await db.afipConfig.findFirst({
      where: { tenantId },
      select: {
        cuit: true,
        certPem: true,
        keyPem: true,
        salesPoint: true,
        env: true,
      },
    });

    return config;
  },

  async getCustomerTaxData(customerId: string) {
    const customer = await db.customer.findUnique({
      where: { id: customerId },
      select: { docType: true, docNumber: true },
    });
    if (!customer) throw new Error("Cliente no encontrado");
    return customer;
  },

  async createInvoiceRecord(
    tenantId: string,
    createdById: string,
    input: CreateInvoiceInput,
    totals: InvoiceTotals,
    afipResult?: AfipCaeResult
  ) {
    const invoice = await db.invoice.create({
      data: {
        tenantId,
        branchId: input.branchId,
        customerId: input.customerId,
        appointmentId: input.appointmentId || null,
        invoiceType: input.invoiceType,
        salesPoint: afipResult?.salesPoint || 1,
        number: afipResult?.invoiceNumber || null,
        cae: afipResult?.cae || null,
        caeExpiration: afipResult?.caeExpiration || null,
        subtotal: totals.subtotal,
        taxTotal: totals.taxTotal,
        total: totals.total,
        status: afipResult?.cae ? "ISSUED" : "DRAFT",
        afipRawData: afipResult?.rawResponse || null,
        createdById,
        items: {
          create: totals.lines.map((line) => ({
            productId: line.productId || null,
            description: line.description,
            quantity: line.quantity,
            unitPrice: line.unitPrice,
            vatRate: line.vatRate,
            subtotal: line.subtotal,
          })),
        },
      },
      select: {
        id: true,
        number: true,
        cae: true,
        total: true,
        status: true,
      },
    });

    return {
      id: invoice.id,
      number: invoice.number || undefined,
      cae: invoice.cae || undefined,
      total: Number(invoice.total),
      status: invoice.status,
    };
  },
};

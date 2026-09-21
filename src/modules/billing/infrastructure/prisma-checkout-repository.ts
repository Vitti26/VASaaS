import { db } from "@/modules/shared/infrastructure/db";
import { CheckoutRepository } from "../domain/checkout-orchestrator";
import { InvoiceType } from "../domain/afip-config";
import { calculateInvoiceTotals } from "../domain/tax-calculator";
import { AfipCaeResult } from "../domain/afip-billing-service";
import { MovementType } from "@/modules/stock/domain/stock-movement";

export const prismaCheckoutRepository: CheckoutRepository = {
  async getAppointmentCheckoutData(tenantId: string, appointmentId: string) {
    const appointment = await db.appointment.findFirst({
      where: { id: appointmentId, tenantId },
      include: {
        customer: { select: { docType: true, docNumber: true } },
        service: {
          select: {
            id: true,
            name: true,
            price: true,
            recipes: {
              select: { productId: true, quantityUsed: true },
            },
          },
        },
      },
    });

    if (!appointment) throw new Error("Turno no encontrado");

    return {
      id: appointment.id,
      branchId: appointment.branchId,
      customerId: appointment.customerId,
      serviceId: appointment.service.id,
      serviceName: appointment.service.name,
      servicePrice: Number(appointment.service.price),
      customerDocType: appointment.customer.docType,
      customerDocNumber: appointment.customer.docNumber,
      serviceRecipes: appointment.service.recipes.map((r) => ({
        productId: r.productId,
        quantityUsed: Number(r.quantityUsed),
      })),
    };
  },

  async getAfipConfig(tenantId: string) {
    return db.afipConfig.findFirst({
      where: { tenantId },
      select: {
        cuit: true,
        certPem: true,
        keyPem: true,
        salesPoint: true,
        env: true,
      },
    });
  },

  async executeAtomicCheckout(params: {
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
  }) {
    return db.$transaction(async (tx) => {
      // 1. Create Invoice record with items
      const invoice = await tx.invoice.create({
        data: {
          tenantId: params.tenantId,
          branchId: params.branchId,
          appointmentId: params.appointmentId,
          customerId: params.customerId,
          invoiceType: params.invoiceType,
          salesPoint: params.afipResult?.salesPoint || 1,
          number: params.afipResult?.invoiceNumber || null,
          cae: params.afipResult?.cae || null,
          caeExpiration: params.afipResult?.caeExpiration || null,
          subtotal: params.totals.subtotal,
          taxTotal: params.totals.taxTotal,
          total: params.totals.total,
          status: params.afipResult?.cae ? "ISSUED" : "DRAFT",
          afipRawData: params.afipResult?.rawResponse || null,
          createdById: params.createdById,
          items: {
            create: params.totals.lines.map((line) => ({
              productId: line.productId || null,
              description: line.description,
              quantity: line.quantity,
              unitPrice: line.unitPrice,
              vatRate: line.vatRate,
              subtotal: line.subtotal,
            })),
          },
        },
      });

      // 2. Mark Appointment as COMPLETED
      await tx.appointment.update({
        where: { id: params.appointmentId },
        data: { status: "COMPLETED" },
      });

      // 3. Perform stock deductions for recipes and extra products
      for (const deduction of params.stockDeductions) {
        // Audit stock movement entry
        await tx.stockMovement.create({
          data: {
            tenantId: params.tenantId,
            branchId: params.branchId,
            productId: deduction.productId,
            type: deduction.type,
            quantity: deduction.quantity,
            reason: deduction.reason,
            referenceId: invoice.id,
            createdById: params.createdById,
          },
        });

        // Decrement branch stock level
        await tx.branchStock.updateMany({
          where: {
            branchId: params.branchId,
            productId: deduction.productId,
          },
          data: {
            quantity: { decrement: deduction.quantity },
          },
        });
      }

      return {
        invoiceId: invoice.id,
        cae: invoice.cae || undefined,
        total: Number(invoice.total),
      };
    });
  },
};

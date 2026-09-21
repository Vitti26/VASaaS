"use server";

import { db } from "@/modules/shared/infrastructure/db";
import { revalidatePath } from "next/cache";
import { SaveAfipConfigSchema, SaveAfipConfigInput } from "./domain/afip-config";

export async function getIssuedInvoicesAction(tenantId: string) {
  const invoices = await db.invoice.findMany({
    where: { tenantId },
    include: {
      customer: { select: { name: true, docType: true, docNumber: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return invoices.map((inv) => ({
    id: inv.id,
    type: inv.invoiceType.replace("_", " "),
    number: `${String(inv.salesPoint).padStart(4, "0")}-${String(inv.number || 0).padStart(8, "0")}`,
    customerName: inv.customer.name,
    customerDoc: `${inv.customer.docType}: ${inv.customer.docNumber || "-"}`,
    date: inv.createdAt.toLocaleDateString("es-AR"),
    subtotal: Number(inv.subtotal),
    taxTotal: Number(inv.taxTotal),
    total: Number(inv.total),
    cae: inv.cae || "PENDIENTE",
    status: inv.status,
  }));
}

export async function getAfipConfigAction(tenantId: string) {
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
}

export async function saveAfipConfigAction(tenantId: string, input: SaveAfipConfigInput) {
  const validated = SaveAfipConfigSchema.parse(input);

  await db.afipConfig.upsert({
    where: {
      tenantId_cuit: {
        tenantId,
        cuit: validated.cuit,
      },
    },
    create: {
      tenantId,
      cuit: validated.cuit,
      certPem: validated.certPem,
      keyPem: validated.keyPem,
      salesPoint: validated.salesPoint,
      env: validated.env,
    },
    update: {
      certPem: validated.certPem,
      keyPem: validated.keyPem,
      salesPoint: validated.salesPoint,
      env: validated.env,
    },
  });

  revalidatePath("/billing");
  return { success: true };
}

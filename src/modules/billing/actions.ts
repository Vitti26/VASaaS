"use server";

import { cookies } from "next/headers";
import { db } from "@/modules/shared/infrastructure/db";
import { revalidatePath } from "next/cache";
import { SaveAfipConfigSchema, SaveAfipConfigInput } from "./domain/afip-config";
import { resolveTenantContext } from "@/modules/shared/infrastructure/tenant-context";

export async function getIssuedInvoicesAction() {
  const cookieStore = cookies();
  const sessionToken = cookieStore.get("vasaas_session")?.value;
  if (!sessionToken) return [];

  const context = await resolveTenantContext(sessionToken);

  const invoices = await db.invoice.findMany({
    where: { tenantId: context.tenantId },
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

export async function getAfipConfigAction() {
  const cookieStore = cookies();
  const sessionToken = cookieStore.get("vasaas_session")?.value;
  if (!sessionToken) return null;

  const context = await resolveTenantContext(sessionToken);

  return db.afipConfig.findFirst({
    where: { tenantId: context.tenantId },
    select: {
      cuit: true,
      certPem: true,
      keyPem: true,
      salesPoint: true,
      env: true,
    },
  });
}

import { assertTenantSubscriptionActive } from "@/modules/subscriptions/domain/subscription-policy";

export async function saveAfipConfigAction(input: SaveAfipConfigInput) {
  const cookieStore = cookies();
  const sessionToken = cookieStore.get("vasaas_session")?.value;
  if (!sessionToken) throw new Error("No autenticado");

  const context = await resolveTenantContext(sessionToken);
  await assertTenantSubscriptionActive(context.tenantId);
  const validated = SaveAfipConfigSchema.parse(input);

  await db.afipConfig.upsert({
    where: {
      tenantId_cuit: {
        tenantId: context.tenantId,
        cuit: validated.cuit,
      },
    },
    create: {
      tenantId: context.tenantId,
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


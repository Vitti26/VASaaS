"use server";

import { cookies } from "next/headers";
import { db } from "@/modules/shared/infrastructure/db";
import { revalidatePath } from "next/cache";
import { createCustomerService, CreateCustomerInput } from "./domain/customer-service";
import { prismaCustomerRepository } from "./infrastructure/prisma-customer-repository";
import { resolveTenantContext } from "@/modules/shared/infrastructure/tenant-context";

export async function getCustomersAction() {
  const cookieStore = cookies();
  const sessionToken = cookieStore.get("vasaas_session")?.value;
  if (!sessionToken) return [];

  const context = await resolveTenantContext(sessionToken);

  const customers = await db.customer.findMany({
    where: { tenantId: context.tenantId },
    orderBy: { name: "asc" },
  });

  return customers.map((c) => ({
    id: c.id,
    name: c.name,
    email: c.email || "-",
    phone: c.phone || "-",
    docType: c.docType,
    docNumber: c.docNumber || "-",
    taxCategory: c.taxCategory,
  }));
}

export async function createCustomerAction(input: CreateCustomerInput) {
  const cookieStore = cookies();
  const sessionToken = cookieStore.get("vasaas_session")?.value;
  if (!sessionToken) throw new Error("No autenticado");

  const context = await resolveTenantContext(sessionToken);

  const customer = await createCustomerService(context, input, prismaCustomerRepository);
  revalidatePath("/customers");
  return { success: true, customer };
}


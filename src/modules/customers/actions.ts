"use server";

import { db } from "@/modules/shared/infrastructure/db";
import { revalidatePath } from "next/cache";
import { createCustomerService, CreateCustomerSchema, CreateCustomerInput } from "./domain/customer-service";
import { prismaCustomerRepository } from "./infrastructure/prisma-customer-repository";

export async function getCustomersAction(tenantId: string) {
  const customers = await db.customer.findMany({
    where: { tenantId },
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

export async function createCustomerAction(tenantId: string, input: CreateCustomerInput) {
  const fakeCtx = {
    tenantId,
    userId: "system",
    role: "ADMIN" as const,
    assignedBranchIds: [],
  };

  const customer = await createCustomerService(fakeCtx, input, prismaCustomerRepository);
  revalidatePath("/customers");
  return { success: true, customer };
}

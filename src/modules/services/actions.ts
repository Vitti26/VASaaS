"use server";

import { cookies } from "next/headers";
import { db } from "@/modules/shared/infrastructure/db";
import { revalidatePath } from "next/cache";
import { createServiceWithRecipe, CreateServiceInput } from "./domain/service-management";
import { prismaServiceRepository } from "./infrastructure/prisma-service-repository";
import { resolveTenantContext } from "@/modules/shared/infrastructure/tenant-context";

export async function getServicesAction() {
  const cookieStore = cookies();
  const sessionToken = cookieStore.get("vasaas_session")?.value;
  if (!sessionToken) return [];

  const context = await resolveTenantContext(sessionToken);

  const services = await db.service.findMany({
    where: { tenantId: context.tenantId },
    include: {
      recipes: {
        include: { product: { select: { name: true } } },
      },
    },
    orderBy: { name: "asc" },
  });

  return services.map((s) => ({
    id: s.id,
    name: s.name,
    description: s.description || "-",
    durationMinutes: s.durationMinutes,
    price: Number(s.price),
    recipeCount: s.recipes.length,
    recipes: s.recipes.map((r) => ({
      productId: r.productId,
      productName: r.product.name,
      quantityUsed: Number(r.quantityUsed),
    })),
  }));
}

import { assertTenantSubscriptionActive } from "@/modules/subscriptions/domain/subscription-policy";

export async function createServiceAction(input: CreateServiceInput) {
  const cookieStore = cookies();
  const sessionToken = cookieStore.get("vasaas_session")?.value;
  if (!sessionToken) throw new Error("No autenticado");

  const context = await resolveTenantContext(sessionToken);
  await assertTenantSubscriptionActive(context.tenantId);

  const service = await createServiceWithRecipe(context, input, prismaServiceRepository);
  revalidatePath("/services");
  return { success: true, service };
}


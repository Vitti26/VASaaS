"use server";

import { db } from "@/modules/shared/infrastructure/db";
import { revalidatePath } from "next/cache";
import { createServiceWithRecipe, CreateServiceSchema, CreateServiceInput } from "./domain/service-management";
import { prismaServiceRepository } from "./infrastructure/prisma-service-repository";

export async function getServicesAction(tenantId: string) {
  const services = await db.service.findMany({
    where: { tenantId },
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

export async function createServiceAction(tenantId: string, userId: string, input: CreateServiceInput) {
  const fakeCtx = {
    tenantId,
    userId,
    role: "OWNER" as const,
    assignedBranchIds: [],
  };

  const service = await createServiceWithRecipe(fakeCtx, input, prismaServiceRepository);
  revalidatePath("/services");
  return { success: true, service };
}

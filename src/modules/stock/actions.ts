"use server";

import { db } from "@/modules/shared/infrastructure/db";
import { revalidatePath } from "next/cache";
import { CreateProductSchema, CreateProductInput } from "./domain/product";
import { registerStockMovementService, RegisterStockMovementSchema, RegisterStockMovementInput } from "./domain/stock-movement";
import { prismaStockRepository } from "./infrastructure/prisma-stock-repository";

export async function getBranchStockAction(tenantId: string, branchId: string) {
  const stocks = await db.branchStock.findMany({
    where: { tenantId, branchId },
    include: {
      product: true,
    },
    orderBy: { product: { name: "asc" } },
  });

  return stocks.map((s) => ({
    id: s.id,
    productId: s.productId,
    name: s.product.name,
    sku: s.product.sku || "-",
    unit: s.product.unit,
    quantity: Number(s.quantity),
    minStockAlert: Number(s.product.minStockAlert),
    isServiceInput: s.product.isServiceInput,
    price: Number(s.product.price),
  }));
}

export async function createProductAction(tenantId: string, branchId: string, input: CreateProductInput) {
  const validated = CreateProductSchema.parse(input);

  const product = await db.product.create({
    data: {
      tenantId,
      name: validated.name,
      sku: validated.sku || null,
      unit: validated.unit,
      price: validated.price,
      cost: validated.cost,
      minStockAlert: validated.minStockAlert,
      isServiceInput: validated.isServiceInput,
      branchStocks: {
        create: {
          tenantId,
          branchId,
          quantity: 0,
        },
      },
    },
  });

  revalidatePath("/stock");
  return { success: true, productId: product.id };
}

export async function registerMovementAction(tenantId: string, userId: string, input: RegisterStockMovementInput) {
  const validated = RegisterStockMovementSchema.parse(input);

  const fakeCtx = {
    tenantId,
    userId,
    role: "OWNER" as const,
    assignedBranchIds: [validated.branchId],
  };

  const result = await registerStockMovementService(fakeCtx, validated, prismaStockRepository);
  revalidatePath("/stock");
  return { success: true, ...result };
}

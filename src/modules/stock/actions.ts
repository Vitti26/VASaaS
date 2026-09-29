"use server";

import { cookies } from "next/headers";
import { db } from "@/modules/shared/infrastructure/db";
import { revalidatePath } from "next/cache";
import { CreateProductSchema, CreateProductInput } from "./domain/product";
import { registerStockMovementService, RegisterStockMovementSchema, RegisterStockMovementInput } from "./domain/stock-movement";
import { prismaStockRepository } from "./infrastructure/prisma-stock-repository";
import { resolveTenantContext } from "@/modules/shared/infrastructure/tenant-context";

export async function getBranchStockAction(branchId?: string) {
  const cookieStore = cookies();
  const sessionToken = cookieStore.get("vasaas_session")?.value;
  if (!sessionToken) return [];

  const context = await resolveTenantContext(sessionToken);

  let targetBranchId = branchId;
  if (!targetBranchId) {
    const branch = await db.branch.findFirst({ where: { tenantId: context.tenantId } });
    if (!branch) return [];
    targetBranchId = branch.id;
  }

  const stocks = await db.branchStock.findMany({
    where: { tenantId: context.tenantId, branchId: targetBranchId },
    include: { product: true },
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

export async function createProductAction(input: CreateProductInput, branchId?: string) {
  const cookieStore = cookies();
  const sessionToken = cookieStore.get("vasaas_session")?.value;
  if (!sessionToken) throw new Error("No autenticado");

  const context = await resolveTenantContext(sessionToken);
  const validated = CreateProductSchema.parse(input);

  let targetBranchId = branchId;
  if (!targetBranchId) {
    const branch = await db.branch.findFirst({ where: { tenantId: context.tenantId } });
    if (!branch) throw new Error("No existe ninguna sucursal registrada");
    targetBranchId = branch.id;
  }

  const product = await db.product.create({
    data: {
      tenantId: context.tenantId,
      name: validated.name,
      sku: validated.sku || null,
      unit: validated.unit,
      price: validated.price,
      cost: validated.cost,
      minStockAlert: validated.minStockAlert,
      isServiceInput: validated.isServiceInput,
      branchStocks: {
        create: {
          tenantId: context.tenantId,
          branchId: targetBranchId,
          quantity: 0,
        },
      },
    },
  });

  revalidatePath("/stock");
  return { success: true, productId: product.id };
}

export async function registerMovementAction(input: RegisterStockMovementInput) {
  const cookieStore = cookies();
  const sessionToken = cookieStore.get("vasaas_session")?.value;
  if (!sessionToken) throw new Error("No autenticado");

  const context = await resolveTenantContext(sessionToken);
  const validated = RegisterStockMovementSchema.parse(input);

  const result = await registerStockMovementService(context, validated, prismaStockRepository);
  revalidatePath("/stock");
  return { success: true, ...result };
}


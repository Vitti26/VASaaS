import { db } from "@/modules/shared/infrastructure/db";
import { Prisma } from "@prisma/client";
import { StockRepository, RegisterStockMovementInput } from "../domain/stock-movement";

export const prismaStockRepository: StockRepository = {
  async getCurrentStock(branchId: string, productId: string): Promise<number> {
    const stockRecord = await db.branchStock.findUnique({
      where: {
        branchId_productId: {
          branchId,
          productId,
        },
      },
      select: { quantity: true },
    });

    return stockRecord ? Number(stockRecord.quantity) : 0;
  },

  async recordMovement(
    tenantId: string,
    createdById: string,
    input: RegisterStockMovementInput,
    newQuantity: number
  ): Promise<{ id: string; newQuantity: number }> {
    return db.$transaction(async (tx: Prisma.TransactionClient) => {
      // 1. Record stock movement entry in audit log
      const movement = await tx.stockMovement.create({
        data: {
          tenantId,
          branchId: input.branchId,
          productId: input.productId,
          type: input.type,
          quantity: input.quantity,
          reason: input.reason || null,
          referenceId: input.referenceId || null,
          createdById,
        },
      });

      // 2. Upsert branch stock level atomically
      await tx.branchStock.upsert({
        where: {
          branchId_productId: {
            branchId: input.branchId,
            productId: input.productId,
          },
        },
        create: {
          tenantId,
          branchId: input.branchId,
          productId: input.productId,
          quantity: newQuantity,
        },
        update: {
          quantity: newQuantity,
        },
      });

      return {
        id: movement.id,
        newQuantity,
      };
    });
  },
};

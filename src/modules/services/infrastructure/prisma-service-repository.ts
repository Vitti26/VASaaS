import { db } from "@/modules/shared/infrastructure/db";
import { ServiceRepository, CreateServiceInput } from "../domain/service-management";

export const prismaServiceRepository: ServiceRepository = {
  async create(tenantId: string, data: CreateServiceInput) {
    const service = await db.service.create({
      data: {
        tenantId,
        name: data.name,
        description: data.description || null,
        durationMinutes: data.durationMinutes,
        price: data.price,
        recipes: {
          create: data.recipes.map((item) => ({
            productId: item.productId,
            quantityUsed: item.quantityUsed,
          })),
        },
      },
      select: {
        id: true,
        name: true,
        durationMinutes: true,
        price: true,
      },
    });

    return {
      id: service.id,
      name: service.name,
      durationMinutes: service.durationMinutes,
      price: Number(service.price),
    };
  },
};

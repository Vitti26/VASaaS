import { db } from "@/modules/shared/infrastructure/db";
import { CustomerRepository, CreateCustomerInput } from "../domain/customer-service";

export const prismaCustomerRepository: CustomerRepository = {
  async create(tenantId: string, data: CreateCustomerInput) {
    return db.customer.create({
      data: {
        tenantId,
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
        docType: data.docType,
        docNumber: data.docNumber || null,
        taxCategory: data.taxCategory,
      },
      select: {
        id: true,
        name: true,
      },
    });
  },

  async listByTenant(tenantId: string) {
    return db.customer.findMany({
      where: { tenantId },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        docType: true,
        docNumber: true,
        taxCategory: true,
      },
    });
  },
};

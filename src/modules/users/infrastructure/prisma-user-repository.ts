import { db } from "@/modules/shared/infrastructure/db";
import { UserRepository, CreateUserInput } from "../domain/user-service";

export const prismaUserRepository: UserRepository = {
  async findByEmail(tenantId: string, email: string): Promise<boolean> {
    const count = await db.user.count({
      where: { tenantId, email },
    });
    return count > 0;
  },

  async create(tenantId: string, data: CreateUserInput & { passwordHash: string }) {
    const user = await db.user.create({
      data: {
        tenantId,
        email: data.email,
        passwordHash: data.passwordHash,
        name: data.name,
        role: data.role,
        userBranches: {
          create: data.assignedBranchIds.map((branchId) => ({
            branchId,
          })),
        },
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    return user;
  },
};

"use server";

import { db } from "@/modules/shared/infrastructure/db";
import { revalidatePath } from "next/cache";
import { createUserService, CreateUserSchema, CreateUserInput } from "./domain/user-service";
import { prismaUserRepository } from "./infrastructure/prisma-user-repository";

export async function getUsersAction(tenantId: string) {
  const users = await db.user.findMany({
    where: { tenantId },
    include: {
      userBranches: {
        include: { branch: { select: { name: true } } },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    branchName: u.userBranches.map((ub) => ub.branch.name).join(", ") || "Todas las sucursales",
  }));
}

export async function createUserAction(tenantId: string, userId: string, input: CreateUserInput) {
  const fakeCtx = {
    tenantId,
    userId,
    role: "OWNER" as const,
    assignedBranchIds: [],
  };

  const user = await createUserService(fakeCtx, input, prismaUserRepository);
  revalidatePath("/users");
  return { success: true, user };
}

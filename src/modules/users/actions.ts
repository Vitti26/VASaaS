"use server";

import { cookies } from "next/headers";
import { db } from "@/modules/shared/infrastructure/db";
import { revalidatePath } from "next/cache";
import { createUserService, CreateUserInput } from "./domain/user-service";
import { prismaUserRepository } from "./infrastructure/prisma-user-repository";
import { resolveTenantContext } from "@/modules/shared/infrastructure/tenant-context";

export async function getUsersAction() {
  const cookieStore = cookies();
  const sessionToken = cookieStore.get("vasaas_session")?.value;
  if (!sessionToken) return [];

  const context = await resolveTenantContext(sessionToken);

  const users = await db.user.findMany({
    where: { tenantId: context.tenantId },
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

import { assertTenantSubscriptionActive } from "@/modules/subscriptions/domain/subscription-policy";

export async function createUserAction(input: {
  name: string;
  email: string;
  password: string;
  role: "OWNER" | "ADMIN" | "STAFF";
  assignedBranchIds?: string[];
}) {
  const cookieStore = cookies();
  const sessionToken = cookieStore.get("vasaas_session")?.value;
  if (!sessionToken) throw new Error("No autenticado");

  const context = await resolveTenantContext(sessionToken);
  await assertTenantSubscriptionActive(context.tenantId);

  let branchIds = input.assignedBranchIds;
  if (!branchIds || branchIds.length === 0) {
    const firstBranch = await db.branch.findFirst({
      where: { tenantId: context.tenantId },
      select: { id: true },
    });
    if (!firstBranch) {
      throw new Error("No existe ninguna sucursal activa para asignar al usuario");
    }
    branchIds = [firstBranch.id];
  }

  const user = await createUserService(
    context,
    {
      name: input.name,
      email: input.email,
      password: input.password,
      role: input.role,
      assignedBranchIds: branchIds,
    },
    prismaUserRepository
  );

  revalidatePath("/users");
  return { success: true, user };
}


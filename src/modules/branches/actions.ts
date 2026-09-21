"use server";

import { db } from "@/modules/shared/infrastructure/db";
import { revalidatePath } from "next/cache";
import { createBranchService, CreateBranchSchema, CreateBranchInput } from "./domain/branch-service";
import { prismaBranchRepository } from "./infrastructure/prisma-branch-repository";

export async function getBranchesAction(tenantId: string) {
  const branches = await db.branch.findMany({
    where: { tenantId },
    orderBy: { createdAt: "asc" },
  });

  return branches.map((b) => ({
    id: b.id,
    name: b.name,
    address: b.address || "-",
    city: b.city || "-",
    phone: b.phone || "-",
    isActive: b.isActive,
  }));
}

export async function createBranchAction(tenantId: string, userId: string, input: CreateBranchInput) {
  const fakeCtx = {
    tenantId,
    userId,
    role: "OWNER" as const,
    assignedBranchIds: [],
  };

  const branch = await createBranchService(fakeCtx, input, prismaBranchRepository);
  revalidatePath("/branches");
  return { success: true, branch };
}

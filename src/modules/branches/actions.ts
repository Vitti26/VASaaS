"use server";

import { cookies } from "next/headers";
import { db } from "@/modules/shared/infrastructure/db";
import { revalidatePath } from "next/cache";
import { createBranchService, CreateBranchInput } from "./domain/branch-service";
import { prismaBranchRepository } from "./infrastructure/prisma-branch-repository";
import { resolveTenantContext } from "@/modules/shared/infrastructure/tenant-context";

export async function getBranchesAction() {
  const cookieStore = cookies();
  const sessionToken = cookieStore.get("vasaas_session")?.value;
  if (!sessionToken) return [];

  const context = await resolveTenantContext(sessionToken);

  const branches = await db.branch.findMany({
    where: { tenantId: context.tenantId },
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

export async function createBranchAction(input: CreateBranchInput) {
  const cookieStore = cookies();
  const sessionToken = cookieStore.get("vasaas_session")?.value;
  if (!sessionToken) throw new Error("No autenticado");

  const context = await resolveTenantContext(sessionToken);

  const branch = await createBranchService(context, input, prismaBranchRepository);
  revalidatePath("/branches");
  return { success: true, branch };
}


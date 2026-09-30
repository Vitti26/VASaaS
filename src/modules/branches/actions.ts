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

import { assertTenantSubscriptionActive, PLAN_LIMITS_MAP } from "@/modules/subscriptions/domain/subscription-policy";
import { assertRole } from "@/modules/shared/infrastructure/permissions";
import { recordAuditLog } from "@/modules/shared/domain/audit-service";

export async function createBranchAction(input: CreateBranchInput) {
  const cookieStore = cookies();
  const sessionToken = cookieStore.get("vasaas_session")?.value;
  if (!sessionToken) throw new Error("No autenticado");

  const context = await resolveTenantContext(sessionToken);
  assertRole(context, ["OWNER"]);
  await assertTenantSubscriptionActive(context.tenantId);

  // Plan limit check: maxBranches
  const tenant = await db.tenant.findUnique({ where: { id: context.tenantId }, select: { plan: true } });
  const limits = PLAN_LIMITS_MAP[tenant?.plan ?? "STARTER"];
  const currentBranchCount = await db.branch.count({ where: { tenantId: context.tenantId } });
  if (currentBranchCount >= limits.maxBranches) {
    throw new Error(
      `Tu plan ${limits.name} permite hasta ${limits.maxBranches} sucursal(es). Mejorá tu plan para agregar más.`
    );
  }

  const branch = await createBranchService(context, input, prismaBranchRepository);
  revalidatePath("/branches");

  recordAuditLog({
    tenantId: context.tenantId,
    userId: context.userId,
    action: "BRANCH_CREATED",
    entityName: "Branch",
    entityId: branch.id,
    details: `Sucursal creada: ${input.name}`,
  }).catch(() => {});

  return { success: true, branch };
}


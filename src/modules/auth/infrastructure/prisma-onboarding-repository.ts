import { db } from "@/modules/shared/infrastructure/db";
import { Prisma } from "@prisma/client";
import { OnboardingRepository } from "../domain/onboarding-service";

export const prismaOnboardingRepository: OnboardingRepository = {
  async findTenantBySlug(slug: string): Promise<boolean> {
    const tenant = await db.tenant.findUnique({
      where: { slug },
      select: { id: true },
    });
    return !!tenant;
  },

  async findUserByEmail(email: string) {
    const user = await db.user.findFirst({
      where: { email },
      include: {
        userBranches: { select: { branchId: true } },
      },
    });

    if (!user) return null;

    return {
      id: user.id,
      tenantId: user.tenantId,
      email: user.email,
      passwordHash: user.passwordHash,
      name: user.name,
      role: user.role,
      assignedBranchIds: user.userBranches.map((ub) => ub.branchId),
    };
  },

  async createTenantWithMasterData(input) {
    return db.$transaction(async (tx: Prisma.TransactionClient) => {
      // 1. Create Tenant
      const tenant = await tx.tenant.create({
        data: {
          name: input.tenantName,
          slug: input.tenantSlug,
          plan: "STARTER",
        },
      });

      // 2. Create Initial Branch
      const branch = await tx.branch.create({
        data: {
          tenantId: tenant.id,
          name: input.branchName,
          address: input.branchAddress || null,
        },
      });

      // 3. Create Owner User and Assign Branch
      const owner = await tx.user.create({
        data: {
          tenantId: tenant.id,
          name: input.ownerName,
          email: input.email,
          passwordHash: input.passwordHash,
          role: "OWNER",
          userBranches: {
            create: [{ branchId: branch.id }],
          },
        },
      });

      // 4. Create Initial Service
      await tx.service.create({
        data: {
          tenantId: tenant.id,
          name: input.serviceName,
          price: input.servicePrice,
          durationMinutes: 45,
          description: "Servicio inicial creado durante el registro",
        },
      });

      return {
        tenantId: tenant.id,
        branchId: branch.id,
        userId: owner.id,
        role: "OWNER" as const,
      };
    });
  },
};

"use server";

import { cookies } from "next/headers";
import { createSessionToken, verifySessionToken } from "@/modules/shared/infrastructure/tenant-context";
import {
  LoginInput,
  LoginSchema,
  RegisterTenantInput,
  RegisterTenantSchema,
  loginUserService,
  registerTenantService,
} from "./domain/onboarding-service";
import { prismaOnboardingRepository } from "./infrastructure/prisma-onboarding-repository";

const SESSION_COOKIE_NAME = "vasaas_session";

export async function registerTenantAction(input: RegisterTenantInput) {
  const parsed = RegisterTenantSchema.safeParse(input);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    throw new Error(firstIssue ? firstIssue.message : "Datos de registro inválidos");
  }

  const result = await registerTenantService(parsed.data, prismaOnboardingRepository);

  const token = await createSessionToken({
    tenantId: result.tenantId,
    userId: result.userId,
    role: result.role,
    assignedBranchIds: [result.branchId],
  });

  const cookieStore = cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24, // 24 hours
    path: "/",
  });

  return { success: true, tenantId: result.tenantId };
}

export async function loginUserAction(input: LoginInput) {
  const parsed = LoginSchema.safeParse(input);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    throw new Error(firstIssue ? firstIssue.message : "Credenciales inválidas");
  }

  const result = await loginUserService(parsed.data, prismaOnboardingRepository);

  const token = await createSessionToken({
    tenantId: result.tenantId,
    userId: result.userId,
    role: result.role,
    assignedBranchIds: result.assignedBranchIds,
  });

  const cookieStore = cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24, // 24 hours
    path: "/",
  });

  return { success: true, name: result.name, role: result.role };
}

export async function logoutUserAction() {
  const cookieStore = cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
  return { success: true };
}

export async function getCurrentSessionAction() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;

    return await verifySessionToken(token);
  } catch (error) {
    return null;
  }
}

export async function getPublicTenantInfoAction(tenantSlug: string) {
  if (!tenantSlug) return null;
  return prismaOnboardingRepository.getTenantDetailsBySlug(tenantSlug);
}

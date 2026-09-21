import { z } from "zod";
import bcrypt from "bcryptjs";
import { TenantContext, UserRoleSchema } from "@/modules/shared/domain/tenant";

export const RegisterTenantSchema = z.object({
  ownerName: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  email: z.string().email("Ingrese un correo electrónico válido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  tenantName: z.string().min(2, "El nombre del negocio debe tener al menos 2 caracteres"),
  tenantSlug: z
    .string()
    .min(2, "El slug debe tener al menos 2 caracteres")
    .regex(/^[a-z0-9-]+$/, "El slug solo puede contener letras minúsculas, números y guiones"),
  branchName: z.string().min(2, "El nombre de la sucursal es obligatorio"),
  branchAddress: z.string().optional(),
  serviceName: z.string().min(2, "Ingrese el nombre del primer servicio"),
  servicePrice: z.number().positive("El precio debe ser un número positivo mayor a 0"),
});

export type RegisterTenantInput = z.infer<typeof RegisterTenantSchema>;

export const LoginSchema = z.object({
  email: z.string().email("Correo electrónico inválido"),
  password: z.string().min(1, "Ingrese su contraseña"),
});

export type LoginInput = z.infer<typeof LoginSchema>;

export const InviteUserSchema = z.object({
  email: z.string().email("Correo electrónico inválido"),
  name: z.string().min(2, "El nombre es obligatorio"),
  role: UserRoleSchema,
  assignedBranchIds: z.array(z.string().min(1)).min(1, "Debe asignar al menos una sucursal"),
});

export type InviteUserInput = z.infer<typeof InviteUserSchema>;

export interface OnboardingRepository {
  findTenantBySlug(slug: string): Promise<boolean>;
  findUserByEmail(email: string): Promise<{
    id: string;
    tenantId: string;
    email: string;
    passwordHash: string;
    name: string;
    role: "OWNER" | "ADMIN" | "STAFF";
    assignedBranchIds: string[];
  } | null>;
  createTenantWithMasterData(input: {
    tenantName: string;
    tenantSlug: string;
    branchName: string;
    branchAddress?: string;
    ownerName: string;
    email: string;
    passwordHash: string;
    serviceName: string;
    servicePrice: number;
  }): Promise<{
    tenantId: string;
    branchId: string;
    userId: string;
    role: "OWNER";
  }>;
}

/**
 * Executes complete onboarding flow for a new business tenant.
 * Atomically creates: Tenant + Initial Branch + OWNER User + Primary Service.
 */
export async function registerTenantService(
  input: RegisterTenantInput,
  repo: OnboardingRepository
) {
  const validated = RegisterTenantSchema.parse(input);

  const slugExists = await repo.findTenantBySlug(validated.tenantSlug);
  if (slugExists) {
    throw new Error("SlugAlreadyExists: El identificador de URL para el negocio ya está registrado");
  }

  const userExists = await repo.findUserByEmail(validated.email);
  if (userExists) {
    throw new Error("UserAlreadyExists: Ya existe una cuenta asociada a este correo electrónico");
  }

  const passwordHash = await bcrypt.hash(validated.password, 10);

  return repo.createTenantWithMasterData({
    tenantName: validated.tenantName,
    tenantSlug: validated.tenantSlug,
    branchName: validated.branchName,
    branchAddress: validated.branchAddress,
    ownerName: validated.ownerName,
    email: validated.email,
    passwordHash,
    serviceName: validated.serviceName,
    servicePrice: validated.servicePrice,
  });
}

/**
 * Verifies credentials for login and returns authenticated session payload.
 */
export async function loginUserService(input: LoginInput, repo: OnboardingRepository) {
  const validated = LoginSchema.parse(input);

  const user = await repo.findUserByEmail(validated.email);
  if (!user) {
    throw new Error("InvalidCredentials: Credenciales inválidas. Verifique su email y contraseña.");
  }

  const passwordValid = await bcrypt.compare(validated.password, user.passwordHash);
  if (!passwordValid) {
    throw new Error("InvalidCredentials: Credenciales inválidas. Verifique su email y contraseña.");
  }

  return {
    tenantId: user.tenantId,
    userId: user.id,
    role: user.role,
    assignedBranchIds: user.assignedBranchIds,
    name: user.name,
    email: user.email,
  };
}

/**
 * Validates role-based permission prior to inviting new users.
 */
export function validateInviteUserPermission(ctx: TenantContext, inputRole: "OWNER" | "ADMIN" | "STAFF") {
  if (ctx.role === "STAFF") {
    throw new Error("Forbidden: Los usuarios con rol STAFF no tienen permisos para invitar o crear personal");
  }

  if (ctx.role === "ADMIN" && inputRole === "OWNER") {
    throw new Error("Forbidden: Un usuario ADMIN no puede otorgar el rol OWNER a otros usuarios");
  }
}

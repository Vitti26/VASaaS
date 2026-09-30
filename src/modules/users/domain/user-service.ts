import { z } from "zod";
import { TenantContext, UserRoleSchema } from "@/modules/shared/domain/tenant";
import { assertRole, assertCanAssignRole } from "@/modules/shared/infrastructure/permissions";
import bcrypt from "bcryptjs";

export const CreateUserSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  role: UserRoleSchema,
  assignedBranchIds: z.array(z.string().uuid("ID de sucursal inválido")).min(1, "Debe asignar al menos 1 sucursal al usuario"),
});

export type CreateUserInput = z.infer<typeof CreateUserSchema>;

export interface UserRepository {
  findByEmail(tenantId: string, email: string): Promise<boolean>;
  create(
    tenantId: string,
    data: CreateUserInput & { passwordHash: string }
  ): Promise<{ id: string; email: string; name: string; role: string }>;
}

export async function createUserService(
  ctx: TenantContext,
  input: CreateUserInput,
  repo: UserRepository
) {
  assertRole(ctx, ["OWNER", "ADMIN"]);
  assertCanAssignRole(ctx, input.role);

  const validated = CreateUserSchema.parse(input);
  const exists = await repo.findByEmail(ctx.tenantId, validated.email);

  if (exists) {
    throw new Error("UserAlreadyExists: El usuario con este correo ya está registrado en la empresa");
  }

  const passwordHash = await bcrypt.hash(validated.password, 10);
  return repo.create(ctx.tenantId, { ...validated, passwordHash });
}

import { TenantContext, UserRole } from "../domain/tenant";

export class ForbiddenError extends Error {
  constructor(message: string = "No tenés permiso para realizar esta acción") {
    super(message);
    this.name = "ForbiddenError";
  }
}

/**
 * Verifica que el rol del contexto esté entre los roles permitidos.
 * Lanza ForbiddenError (no un string genérico) si no cumple.
 */
export function assertRole(context: TenantContext, allowedRoles: UserRole[]): void {
  if (!allowedRoles.includes(context.role)) {
    throw new ForbiddenError(
      `Esta acción requiere uno de estos roles: ${allowedRoles.join(", ")}. Tu rol actual es ${context.role}.`
    );
  }
}

/**
 * Casos con reglas más finas que un simple allowlist de roles
 * (ej: un ADMIN puede crear usuarios pero no OWNERs).
 */
export function assertCanAssignRole(context: TenantContext, targetRole: UserRole): void {
  if (context.role === "ADMIN" && targetRole === "OWNER") {
    throw new ForbiddenError("Un ADMIN no puede crear ni ascender a otro usuario a OWNER");
  }
  if (context.role === "STAFF") {
    throw new ForbiddenError("Un STAFF no puede gestionar usuarios");
  }
}

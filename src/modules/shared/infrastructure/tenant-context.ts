import { jwtVerify, SignJWT } from "jose";
import { AuthSessionPayload, TenantContext, TenantContextSchema } from "../domain/tenant";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "fallback-secret-for-development-tests-only-min-32-chars"
);

export async function createSessionToken(payload: AuthSessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(JWT_SECRET);
}

export async function verifySessionToken(token: string): Promise<TenantContext> {
  let payload: Record<string, unknown>;
  try {
    const verified = await jwtVerify(token, JWT_SECRET);
    payload = verified.payload as Record<string, unknown>;
  } catch (error) {
    throw new Error("Unauthorized: Invalid or expired session token");
  }

  const parsed = TenantContextSchema.safeParse({
    tenantId: payload.tenantId,
    userId: payload.userId,
    role: payload.role,
    assignedBranchIds: payload.assignedBranchIds,
  });

  if (!parsed.success) {
    throw new Error(`Invalid session payload: ${parsed.error.message}`);
  }

  return parsed.data;
}

/**
 * Resolves the authenticated tenant context from the authorization header or session cookie.
 * Multi-tenancy rule: Never trust client-provided tenant_id in query params or request bodies.
 */
export async function resolveTenantContext(
  authHeaderOrCookie?: string | null
): Promise<TenantContext> {
  if (!authHeaderOrCookie) {
    throw new Error("Unauthorized: Missing session authentication credentials");
  }

  const token = authHeaderOrCookie.startsWith("Bearer ")
    ? authHeaderOrCookie.slice(7)
    : authHeaderOrCookie;

  return verifySessionToken(token);
}

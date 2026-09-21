import { z } from "zod";

export const UserRoleSchema = z.enum(["OWNER", "ADMIN", "STAFF"]);
export type UserRole = z.infer<typeof UserRoleSchema>;

export const TenantContextSchema = z.object({
  tenantId: z.string().uuid("Invalid Tenant ID format"),
  userId: z.string().uuid("Invalid User ID format"),
  role: UserRoleSchema,
  assignedBranchIds: z.array(z.string().uuid()),
});

export type TenantContext = z.infer<typeof TenantContextSchema>;

export interface AuthSessionPayload {
  tenantId: string;
  userId: string;
  role: UserRole;
  assignedBranchIds: string[];
  iat?: number;
  exp?: number;
}

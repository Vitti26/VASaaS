import { z } from "zod";

export const AuditLogSchema = z.object({
  tenantId: z.string().min(1),
  userId: z.string().min(1),
  action: z.enum([
    "INVOICE_ISSUED",
    "INVOICE_ANNULLED",
    "STOCK_RECORDED",
    "STOCK_ADJUSTED",
    "USER_ROLE_CHANGED",
    "BRANCH_CREATED",
  ]),
  entityName: z.string().min(1),
  entityId: z.string().min(1),
  details: z.string().optional(),
});

export type AuditLogInput = z.infer<typeof AuditLogSchema>;

export interface AuditLogEntry extends AuditLogInput {
  id: string;
  timestamp: Date;
}

// In-memory audit log store
const inMemoryAuditLogs: AuditLogEntry[] = [];

export interface AuditRepository {
  record(entry: AuditLogInput): Promise<AuditLogEntry>;
  listByTenant(tenantId: string): Promise<AuditLogEntry[]>;
}

export async function recordAuditLog(
  input: AuditLogInput,
  repo?: AuditRepository
): Promise<AuditLogEntry> {
  const validated = AuditLogSchema.parse(input);

  if (repo) {
    return repo.record(validated);
  }

  const entry: AuditLogEntry = {
    id: "audit-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7),
    ...validated,
    timestamp: new Date(),
  };

  inMemoryAuditLogs.unshift(entry);
  return entry;
}

export async function getAuditLogs(tenantId: string, repo?: AuditRepository): Promise<AuditLogEntry[]> {
  if (repo) {
    return repo.listByTenant(tenantId);
  }
  return inMemoryAuditLogs.filter((log) => log.tenantId === tenantId);
}

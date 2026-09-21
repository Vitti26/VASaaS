import { describe, it, expect } from "vitest";
import {
  createSessionToken,
  resolveTenantContext,
  verifySessionToken,
} from "../infrastructure/tenant-context";

describe("Multi-Tenant Context Security & Session Isolation", () => {
  const validPayload = {
    tenantId: "11111111-1111-4111-a111-111111111111",
    userId: "22222222-2222-4222-a222-222222222222",
    role: "OWNER" as const,
    assignedBranchIds: ["33333333-3333-4333-a333-333333333333"],
  };

  it("should successfully generate and resolve valid session token", async () => {
    const token = await createSessionToken(validPayload);
    const context = await resolveTenantContext(`Bearer ${token}`);

    expect(context.tenantId).toBe(validPayload.tenantId);
    expect(context.userId).toBe(validPayload.userId);
    expect(context.role).toBe("OWNER");
    expect(context.assignedBranchIds).toHaveLength(1);
  });

  it("should reject token if signature is invalid or tampered", async () => {
    const token = await createSessionToken(validPayload);
    const tamperedToken = token + "tampered";

    await expect(resolveTenantContext(`Bearer ${tamperedToken}`)).rejects.toThrow(
      "Unauthorized: Invalid or expired session token"
    );
  });

  it("should fail when authentication header is missing", async () => {
    await expect(resolveTenantContext(null)).rejects.toThrow(
      "Unauthorized: Missing session authentication credentials"
    );
  });

  it("should fail if tenantId in token payload is not a valid UUID", async () => {
    const invalidPayload = {
      ...validPayload,
      tenantId: "not-a-uuid",
    };

    const token = await createSessionToken(invalidPayload);
    await expect(verifySessionToken(token)).rejects.toThrow("Invalid session payload");
  });
});

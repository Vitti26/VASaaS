import { describe, it, expect, beforeEach } from "vitest";
import {
  checkRateLimit,
  resetRateLimitStore,
  checkIpBookingRateLimit,
  checkTenantBookingRateLimit,
  checkPhoneBookingLimit,
} from "../infrastructure/rate-limiter";
import { PublicBookingSchema } from "@/modules/agenda/domain/appointment";
import { createPublicBookingAction } from "@/modules/agenda/actions";
import { createSessionToken, verifySessionToken, resolveTenantContext } from "../infrastructure/tenant-context";

describe("Fase 10: Security Audit & Protection Suite", () => {
  beforeEach(() => {
    resetRateLimitStore();
  });

  describe("1. Rate Limiting Engine", () => {
    it("should allow requests up to limit and block excess requests", () => {
      const key = "test-ip-127.0.0.1";
      const max = 3;
      const windowMs = 60 * 1000;

      expect(checkRateLimit(key, max, windowMs).allowed).toBe(true);
      expect(checkRateLimit(key, max, windowMs).allowed).toBe(true);
      expect(checkRateLimit(key, max, windowMs).allowed).toBe(true);

      // 4th request should be blocked
      const blocked = checkRateLimit(key, max, windowMs);
      expect(blocked.allowed).toBe(false);
      expect(blocked.remaining).toBe(0);
      expect(blocked.resetMs).toBeGreaterThan(0);
    });

    it("should reset rate limit counters when resetRateLimitStore is called", () => {
      const key = "test-ip-127.0.0.1";
      checkRateLimit(key, 1, 60000);
      expect(checkRateLimit(key, 1, 60000).allowed).toBe(false);

      resetRateLimitStore();

      expect(checkRateLimit(key, 1, 60000).allowed).toBe(true);
    });

    it("should enforce IP and Tenant rate limit helpers", () => {
      const ip = "192.168.1.50";
      for (let i = 0; i < 5; i++) {
        expect(checkIpBookingRateLimit(ip)).toBe(true);
      }
      expect(checkIpBookingRateLimit(ip)).toBe(false);

      const tenant = "barberia-palermo";
      for (let i = 0; i < 30; i++) {
        expect(checkTenantBookingRateLimit(tenant)).toBe(true);
      }
      expect(checkTenantBookingRateLimit(tenant)).toBe(false);
    });
  });

  describe("2. XSS Input Sanitization", () => {
    it("should strip HTML tags from customerName and notes in Zod schema", () => {
      const malformedInput = {
        tenantSlug: "barberia-central",
        branchSlug: "palermo",
        serviceId: "srv-demo-1",
        staffId: "staff-demo-1",
        startAt: new Date("2026-10-15T14:00:00Z"),
        customerName: "Juan <script>alert('xss')</script> Pérez",
        customerPhone: "+54 11 1234 5678",
        notes: "<b>Notas con HTML</b> <img src='x' onerror='alert(1)'>",
      };

      const parsed = PublicBookingSchema.parse(malformedInput);

      expect(parsed.customerName).toBe("Juan alert('xss') Pérez");
      expect(parsed.notes).toBe("Notas con HTML");
    });
  });

  describe("3. Anti-Bot Protection & Quotas", () => {
    it("should reject bookings when honeypot website field is populated", async () => {
      const input = {
        tenantSlug: "barberia-central",
        branchSlug: "palermo",
        serviceId: "srv-demo-1",
        staffId: "staff-demo-1",
        startAt: new Date("2026-10-15T14:00:00Z"),
        customerName: "Bot Spammer",
        customerPhone: "+54 11 0000 0000",
        website: "http://spam-link.com",
      };

      await expect(createPublicBookingAction(input)).rejects.toThrow("protección anti-bot");
    });

    it("should reject bookings submitted faster than humanly possible (under 1200ms)", async () => {
      const input = {
        tenantSlug: "barberia-central",
        branchSlug: "palermo",
        serviceId: "srv-demo-1",
        staffId: "staff-demo-1",
        startAt: new Date("2026-10-15T14:00:00Z"),
        customerName: "Fast Bot",
        customerPhone: "+54 11 0000 0001",
        formLoadedAt: Date.now(), // Submitted immediately (<10ms)
      };

      await expect(createPublicBookingAction(input)).rejects.toThrow("demasiado rápido");
    });

    it("should enforce phone booking quota limits", () => {
      expect(checkPhoneBookingLimit(0, 3)).toBe(true);
      expect(checkPhoneBookingLimit(2, 3)).toBe(true);
      expect(checkPhoneBookingLimit(3, 3)).toBe(false);
      expect(checkPhoneBookingLimit(4, 3)).toBe(false);
    });
  });

  describe("4. Authentication & Multi-Tenant Session Security", () => {
    it("should generate and verify valid JWT session tokens", async () => {
      const payload = {
        tenantId: "123e4567-e89b-12d3-a456-426614174000",
        userId: "123e4567-e89b-12d3-a456-426614174001",
        role: "OWNER" as const,
        assignedBranchIds: ["123e4567-e89b-12d3-a456-426614174002"],
      };

      const token = await createSessionToken(payload);
      expect(token).toBeDefined();

      const verified = await verifySessionToken(token);
      expect(verified.tenantId).toBe(payload.tenantId);
      expect(verified.role).toBe("OWNER");
    });

    it("should reject tampered or invalid JWT tokens", async () => {
      const invalidToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature";
      await expect(verifySessionToken(invalidToken)).rejects.toThrow("Unauthorized");
    });

    it("should throw unauthorized error when resolving missing context", async () => {
      await expect(resolveTenantContext(null)).rejects.toThrow("Unauthorized");
    });
  });
});

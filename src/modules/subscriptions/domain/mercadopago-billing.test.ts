import { describe, it, expect, beforeEach } from "vitest";
import crypto from "crypto";
import {
  canTenantPerformWriteOperation,
  assertTenantCanWrite,
  SubscriptionPastDueError,
  calculateDepositExpiration,
  verifyMercadoPagoWebhookSignature,
} from "./subscription-policy";
import { clearProcessedWebhookEvents, POST } from "@/app/api/webhooks/mercadopago/route";

describe("Fase 12: Mercado Pago Subscriptions & Soft-Lock Test Suite", () => {
  const secretKey = "test-secret-key-123456";

  beforeEach(() => {
    clearProcessedWebhookEvents();
  });

  describe("1. HMAC SHA-256 Webhook Signature Validation", () => {
    it("should validate legitimate Mercado Pago webhook signature header", () => {
      const rawBody = JSON.stringify({ action: "payment.created", data: { id: "12345" } });
      const ts = "1700000000";
      const manifest = `id:ts:${ts};${rawBody}`;
      const hash = crypto.createHmac("sha256", secretKey).update(manifest).digest("hex");
      const xSignature = `ts=${ts},v1=${hash}`;

      expect(verifyMercadoPagoWebhookSignature(rawBody, xSignature, secretKey)).toBe(true);
    });

    it("should reject tampered payload or invalid signature header", () => {
      const rawBody = JSON.stringify({ action: "payment.created", data: { id: "12345" } });
      const badSignature = "ts=1700000000,v1=invalidhash1234567890abcdef";

      expect(verifyMercadoPagoWebhookSignature(rawBody, badSignature, secretKey)).toBe(false);
      expect(verifyMercadoPagoWebhookSignature(rawBody, undefined, secretKey)).toBe(false);
    });
  });

  describe("2. Soft-Lock (Bloqueo Suave por Impago)", () => {
    it("should allow write operations for TRIALING and ACTIVE subscriptions", () => {
      expect(canTenantPerformWriteOperation("TRIALING")).toBe(true);
      expect(canTenantPerformWriteOperation("ACTIVE")).toBe(true);
      expect(() => assertTenantCanWrite("ACTIVE")).not.toThrow();
    });

    it("should enforce read-only mode for PAST_DUE and CANCELED subscriptions", () => {
      expect(canTenantPerformWriteOperation("PAST_DUE")).toBe(false);
      expect(canTenantPerformWriteOperation("CANCELED")).toBe(false);

      expect(() => assertTenantCanWrite("PAST_DUE")).toThrow(SubscriptionPastDueError);
      expect(() => assertTenantCanWrite("CANCELED")).toThrow(SubscriptionPastDueError);
    });
  });

  describe("3. Webhook Idempotency & Deduplication", () => {
    it("should process webhook once and return idempotent message on duplicate call", async () => {
      const payload = {
        action: "subscription.updated",
        data: { id: "sub-mp-999" },
        tenantId: "tenant-demo-id",
        newStatus: "ACTIVE",
        plan: "PRO",
      };

      const req1 = new Request("http://localhost/api/webhooks/mercadopago", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const res1 = await POST(req1);
      const json1 = await res1.json();
      expect(res1.status).toBe(200);
      expect(json1.success).toBe(true);

      // Duplicate request with exact same payload
      const req2 = new Request("http://localhost/api/webhooks/mercadopago", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const res2 = await POST(req2);
      const json2 = await res2.json();
      expect(res2.status).toBe(200);
      expect(json2.message).toContain("Idempotente");
    });
  });

  describe("4. Deposit Expiration Calculation", () => {
    it("should calculate 15-minute expiration timestamp for pending deposit bookings", () => {
      const now = Date.now();
      const expiration = calculateDepositExpiration(15);
      const diffMinutes = (expiration.getTime() - now) / (60 * 1000);

      expect(diffMinutes).toBeGreaterThanOrEqual(14.9);
      expect(diffMinutes).toBeLessThanOrEqual(15.1);
    });
  });
});

import { describe, it, expect, vi } from "vitest";
import {
  isTrialActive,
  checkFeatureAccess,
  processMercadoPagoWebhook,
  SubscriptionRepository,
  SubscriptionInfo,
} from "./subscription-service";

describe("Subscription SaaS Domain Logic & Feature Gates", () => {
  describe("isTrialActive", () => {
    it("should return true when trialEndsAt is in the future", () => {
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days in future
      expect(isTrialActive(futureDate)).toBe(true);
    });

    it("should return false when trialEndsAt has expired", () => {
      const pastDate = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000); // 1 day in past
      expect(isTrialActive(pastDate)).toBe(false);
    });
  });

  describe("checkFeatureAccess", () => {
    it("should allow AFIP on PRO plan during active trial", () => {
      const sub: SubscriptionInfo = {
        status: "TRIALING",
        plan: "PRO",
        trialEndsAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        currentPeriodEnd: null,
      };

      expect(checkFeatureAccess(sub, "AFIP")).toBe(true);
      expect(checkFeatureAccess(sub, "MULTI_BRANCH")).toBe(true);
    });

    it("should deny AFIP on STARTER plan even when subscription is ACTIVE", () => {
      const sub: SubscriptionInfo = {
        status: "ACTIVE",
        plan: "STARTER",
        trialEndsAt: null,
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      };

      expect(checkFeatureAccess(sub, "AFIP")).toBe(false);
      expect(checkFeatureAccess(sub, "MULTI_BRANCH")).toBe(false);
    });

    it("should deny all features if subscription is CANCELED and trial is expired", () => {
      const sub: SubscriptionInfo = {
        status: "CANCELED",
        plan: "PRO",
        trialEndsAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        currentPeriodEnd: null,
      };

      expect(checkFeatureAccess(sub, "AFIP")).toBe(false);
    });
  });

  describe("processMercadoPagoWebhook", () => {
    it("should update subscription status and upgrade tenant plan on payment received", async () => {
      const mockRepo: SubscriptionRepository = {
        getSubscription: vi.fn(),
        updateSubscriptionStatus: vi.fn().mockResolvedValue(undefined),
        updateTenantPlan: vi.fn().mockResolvedValue(undefined),
      };

      const event = {
        action: "payment.created",
        data: { id: "mp-sub-12345" },
        tenantId: "11111111-1111-4111-a111-111111111111",
        newStatus: "ACTIVE" as const,
        plan: "PRO" as const,
      };

      await processMercadoPagoWebhook(event, mockRepo);

      expect(mockRepo.updateSubscriptionStatus).toHaveBeenCalledWith(
        event.tenantId,
        "mp-sub-12345",
        "ACTIVE",
        expect.any(Date)
      );
      expect(mockRepo.updateTenantPlan).toHaveBeenCalledWith(event.tenantId, "PRO");
    });
  });
});

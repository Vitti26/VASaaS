import { z } from "zod";
import { TenantContext } from "@/modules/shared/domain/tenant";

export const SubscriptionStatusSchema = z.enum(["TRIALING", "ACTIVE", "PAST_DUE", "CANCELED"]);
export type SubscriptionStatus = z.infer<typeof SubscriptionStatusSchema>;

export const PlanTypeSchema = z.enum(["STARTER", "PRO"]);
export type PlanType = z.infer<typeof PlanTypeSchema>;

export interface SubscriptionInfo {
  status: SubscriptionStatus;
  plan: PlanType;
  trialEndsAt: Date | null;
  currentPeriodEnd: Date | null;
}

export interface SubscriptionRepository {
  getSubscription(tenantId: string): Promise<SubscriptionInfo | null>;
  updateSubscriptionStatus(
    tenantId: string,
    mpSubscriptionId: string,
    status: SubscriptionStatus,
    periodEnd?: Date
  ): Promise<void>;
  updateTenantPlan(tenantId: string, plan: PlanType): Promise<void>;
}

/**
 * Calculates trial status: active if trialEndsAt is in the future.
 */
export function isTrialActive(trialEndsAt: Date | null): boolean {
  if (!trialEndsAt) return false;
  return trialEndsAt.getTime() > Date.now();
}

/**
 * Evaluates feature access based on plan and subscription status:
 * - AFIP is allowed only on PRO plan with ACTIVE subscription or active TRIAL.
 */
export function checkFeatureAccess(sub: SubscriptionInfo, feature: "AFIP" | "MULTI_BRANCH"): boolean {
  const isSubscriberActive = sub.status === "ACTIVE" || isTrialActive(sub.trialEndsAt);

  if (!isSubscriberActive) return false;

  if (feature === "AFIP") {
    return sub.plan === "PRO";
  }

  if (feature === "MULTI_BRANCH") {
    return sub.plan === "PRO";
  }

  return true;
}

/**
 * Process incoming Mercado Pago webhook event idempotently.
 */
export async function processMercadoPagoWebhook(
  event: {
    action: string;
    data: { id: string };
    tenantId: string;
    newStatus: SubscriptionStatus;
    plan: PlanType;
  },
  repo: SubscriptionRepository
) {
  if (!event.data?.id || !event.tenantId) {
    throw new Error("InvalidWebhookEvent: Falta el ID de suscripción de Mercado Pago o el tenantId");
  }

  await repo.updateSubscriptionStatus(
    event.tenantId,
    event.data.id,
    event.newStatus,
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days period
  );

  if (event.newStatus === "ACTIVE") {
    await repo.updateTenantPlan(event.tenantId, event.plan);
  }
}

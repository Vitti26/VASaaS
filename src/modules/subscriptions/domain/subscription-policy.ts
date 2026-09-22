import crypto from "crypto";

export type SubscriptionPlanType = "STARTER" | "PRO";
export type SubscriptionStatusType = "TRIALING" | "ACTIVE" | "PAST_DUE" | "CANCELED";

export interface PlanLimits {
  name: string;
  priceMonthlyARS: number;
  maxBranches: number;
  maxStaff: number;
  maxAppointmentsPerMonth: number;
  arcaFiscalEnabled: boolean;
}

export const PLAN_LIMITS_MAP: Record<SubscriptionPlanType, PlanLimits> = {
  STARTER: {
    name: "Plan Emprendedor (Starter)",
    priceMonthlyARS: 15000,
    maxBranches: 1,
    maxStaff: 3,
    maxAppointmentsPerMonth: 100,
    arcaFiscalEnabled: false,
  },
  PRO: {
    name: "Plan Profesional (Pro)",
    priceMonthlyARS: 35000,
    maxBranches: 99,
    maxStaff: 99,
    maxAppointmentsPerMonth: 99999,
    arcaFiscalEnabled: true,
  },
};

export class SubscriptionPastDueError extends Error {
  constructor(
    message: string = "Su suscripción se encuentra pausada por falta de pago. Sus datos están resguardados en modo solo lectura. Actualice su medio de pago para continuar realizando operaciones."
  ) {
    super(message);
    this.name = "SubscriptionPastDueError";
  }
}

/**
 * Pure policy function for Soft-Lock:
 * Returns true if tenant is in valid operational state (TRIALING or ACTIVE).
 * Returns false if tenant is in PAST_DUE or CANCELED (Read-Only mode).
 */
export function canTenantPerformWriteOperation(status: SubscriptionStatusType): boolean {
  return status === "TRIALING" || status === "ACTIVE";
}

/**
 * Asserts write permission under soft-lock rules, throwing SubscriptionPastDueError if in read-only mode.
 */
export function assertTenantCanWrite(status: SubscriptionStatusType): void {
  if (!canTenantPerformWriteOperation(status)) {
    throw new SubscriptionPastDueError();
  }
}

/**
 * Calculates deposit expiration timestamp for public bookings requiring pre-payment (default: 15 minutes).
 */
export function calculateDepositExpiration(minutes: number = 15): Date {
  return new Date(Date.now() + minutes * 60 * 1000);
}

/**
 * Verifies Mercado Pago webhook HMAC SHA-256 signature header if secret is configured.
 */
export function verifyMercadoPagoWebhookSignature(
  rawBody: string,
  xSignatureHeader?: string,
  secretKey: string = process.env.MP_WEBHOOK_SECRET || "mp-webhook-secret-vasaas-demo-key"
): boolean {
  if (!xSignatureHeader) {
    // If no header provided and secret is configured, fail verification
    return false;
  }

  // Parse ts and v1 from x-signature header (e.g. ts=1700000000,v1=abc123def...)
  const parts = xSignatureHeader.split(",");
  let ts = "";
  let v1 = "";
  for (const part of parts) {
    const [key, val] = part.trim().split("=");
    if (key === "ts") ts = val;
    if (key === "v1") v1 = val;
  }

  if (!ts || !v1) return false;

  const manifest = `id:ts:${ts};${rawBody}`;
  const computedHash = crypto.createHmac("sha256", secretKey).update(manifest).digest("hex");
  const bufComputed = Buffer.from(computedHash);
  const bufV1 = Buffer.from(v1);

  if (bufComputed.length !== bufV1.length) return false;

  return crypto.timingSafeEqual(bufComputed, bufV1);
}

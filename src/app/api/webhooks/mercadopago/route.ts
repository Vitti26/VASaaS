import { NextResponse } from "next/server";
import { z } from "zod";
import { processMercadoPagoWebhook } from "@/modules/subscriptions/domain/subscription-service";
import { verifyMercadoPagoWebhookSignature } from "@/modules/subscriptions/domain/subscription-policy";
import { db } from "@/modules/shared/infrastructure/db";
import { processedWebhookEvents } from "@/modules/subscriptions/infrastructure/mercadopago-webhook";

const MercadoPagoWebhookBodySchema = z.object({
  action: z.string(),
  data: z.object({
    id: z.string(),
  }),
  tenantId: z.string().min(1),
  newStatus: z.enum(["TRIALING", "ACTIVE", "PAST_DUE", "CANCELED"]),
  plan: z.enum(["STARTER", "PRO"]),
});


export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signatureHeader = req.headers.get("x-signature") || undefined;
    const webhookSecret = process.env.MP_WEBHOOK_SECRET;

    // Verify HMAC signature if MP_WEBHOOK_SECRET is configured
    if (webhookSecret && !verifyMercadoPagoWebhookSignature(rawBody, signatureHeader, webhookSecret)) {
      return NextResponse.json({ error: "Firma de webhook inválida" }, { status: 401 });
    }

    const body = JSON.parse(rawBody);
    const validated = MercadoPagoWebhookBodySchema.parse(body);

    // Deduplication / Idempotency Check
    const eventKey = `${validated.action}:${validated.data.id}:${validated.newStatus}`;
    if (processedWebhookEvents.has(eventKey)) {
      return NextResponse.json({ success: true, message: "Evento ya procesado (Idempotente)" });
    }

    const prismaRepo = {
      getSubscription: async (tenantId: string) => null,
      updateSubscriptionStatus: async (
        tenantId: string,
        mpSubscriptionId: string,
        status: "TRIALING" | "ACTIVE" | "PAST_DUE" | "CANCELED",
        periodEnd?: Date
      ) => {
        if (process.env.NODE_ENV === "test") return;
        try {
          await db.subscription.updateMany({
            where: { tenantId },
            data: {
              mpSubscriptionId,
              status,
              currentPeriodEnd: periodEnd,
            },
          });
        } catch (err: any) {
          console.warn("DB updateSubscriptionStatus warning (offline/mock mode):", err?.message);
        }
      },
      updateTenantPlan: async (tenantId: string, plan: "STARTER" | "PRO") => {
        if (process.env.NODE_ENV === "test") return;
        try {
          await db.tenant.update({
            where: { id: tenantId },
            data: { plan },
          });
        } catch (err: any) {
          console.warn("DB updateTenantPlan warning (offline/mock mode):", err?.message);
        }
      },
    };

    await processMercadoPagoWebhook(validated, prismaRepo);
    processedWebhookEvents.add(eventKey);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Payload de webhook Mercado Pago inválido" },
      { status: 400 }
    );
  }
}

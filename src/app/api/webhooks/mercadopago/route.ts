// Next.js App Router Route: Only HTTP handlers (e.g. POST) are exported to prevent Vercel build errors.
export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { z } from "zod";
import { processMercadoPagoWebhook } from "@/modules/subscriptions/domain/subscription-service";
import { verifyMercadoPagoWebhookSignature } from "@/modules/subscriptions/domain/subscription-policy";
import { db } from "@/modules/shared/infrastructure/db";
import { processedWebhookEvents } from "@/modules/subscriptions/infrastructure/mercadopago-webhook";

const MercadoPagoWebhookBodySchema = z.object({
  action: z.string().optional(),
  data: z.object({
    id: z.string(),
  }),
  tenantId: z.string().optional(),
  newStatus: z.enum(["TRIALING", "ACTIVE", "PAST_DUE", "CANCELED"]).optional(),
  plan: z.enum(["STARTER", "PRO"]).optional(),
});

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();

    // 1. Payload size limit (Max 100 KB)
    if (rawBody.length > 100 * 1024) {
      return NextResponse.json({ error: "Payload demasiado grande" }, { status: 413 });
    }

    const signatureHeader = req.headers.get("x-signature") || undefined;
    const webhookSecret = process.env.MP_WEBHOOK_SECRET;
    const mpAccessToken = process.env.MP_ACCESS_TOKEN;

    // 2. En producción, tanto el secreto de firma como el access token son obligatorios.
    //    Si falta alguno, no hay forma segura de verificar el webhook: se rechaza.
    if (process.env.NODE_ENV === "production" && (!webhookSecret || !mpAccessToken)) {
      return NextResponse.json(
        { error: "Configuración de MP_WEBHOOK_SECRET o MP_ACCESS_TOKEN faltante en el servidor" },
        { status: 500 }
      );
    }

    if (webhookSecret && !verifyMercadoPagoWebhookSignature(rawBody, signatureHeader, webhookSecret)) {
      return NextResponse.json({ error: "Firma de webhook inválida" }, { status: 401 });
    }

    const body = JSON.parse(rawBody);
    const validated = MercadoPagoWebhookBodySchema.parse(body);
    const mpSubscriptionId = validated.data.id;

    // 3. Buscar la suscripción en la BD por mpSubscriptionId (nunca confiar en tenantId del body)
    let tenantId: string | null = null;

    if (process.env.NODE_ENV !== "test") {
      const existingSub = await db.subscription.findFirst({ where: { mpSubscriptionId } });
      if (existingSub) tenantId = existingSub.tenantId;
    }

    // Fallback SOLO permitido en tests, nunca en producción ni preview.
    if (!tenantId && process.env.NODE_ENV === "test" && validated.tenantId) {
      tenantId = validated.tenantId;
    }

    if (!tenantId) {
      return NextResponse.json(
        { error: "Suscripción no encontrada en la base de datos para mpSubscriptionId" },
        { status: 404 }
      );
    }

    // 4. Consultar el estado y plan REALES vía la API de Mercado Pago. Si falla, no seguimos:
    //    devolvemos error para que Mercado Pago reintente el webhook más tarde.
    let realStatus: "TRIALING" | "ACTIVE" | "PAST_DUE" | "CANCELED" = "ACTIVE";
    let realPlan: "STARTER" | "PRO" = "PRO";

    if (mpAccessToken) {
      try {
        const mpRes = await fetch(`https://api.mercadopago.com/preapproval/${mpSubscriptionId}`, {
          headers: { Authorization: `Bearer ${mpAccessToken}` },
        });

        if (!mpRes.ok) {
          return NextResponse.json({ error: "No se pudo verificar la suscripción con Mercado Pago" }, { status: 502 });
        }

        const mpData = await mpRes.json();

        if (mpData.status === "authorized") realStatus = "ACTIVE";
        else if (mpData.status === "paused") realStatus = "PAST_DUE";
        else if (mpData.status === "cancelled") realStatus = "CANCELED";
        else realStatus = "TRIALING";

        // external_reference se guarda como "tenantId:plan" al crear el checkout
        const refParts = (mpData.external_reference || "").split(":");
        realPlan = refParts[1] === "STARTER" ? "STARTER" : "PRO";
      } catch (err: any) {
        console.warn("Mercado Pago API query error:", err?.message);
        return NextResponse.json({ error: "Error consultando Mercado Pago, reintentar" }, { status: 502 });
      }
    } else if (process.env.NODE_ENV === "test") {
      realStatus = (validated.newStatus as any) || "ACTIVE";
      realPlan = (validated.plan as any) || "PRO";
    }

    // 5. Idempotencia: basada en datos ya verificados, no en el body original
    const eventKey = `${mpSubscriptionId}:${realStatus}:${realPlan}`;
    if (processedWebhookEvents.has(eventKey)) {
      return NextResponse.json({ success: true, message: "Evento ya procesado (Idempotente)" });
    }

    const prismaRepo = {
      getSubscription: async (tid: string) => null,
      updateSubscriptionStatus: async (
        tid: string,
        mpSubId: string,
        status: "TRIALING" | "ACTIVE" | "PAST_DUE" | "CANCELED",
        periodEnd?: Date
      ) => {
        if (process.env.NODE_ENV === "test") return;
        await db.subscription.updateMany({
          where: { tenantId: tid },
          data: { mpSubscriptionId: mpSubId, status, currentPeriodEnd: periodEnd },
        });
      },
      updateTenantPlan: async (tid: string, plan: "STARTER" | "PRO") => {
        if (process.env.NODE_ENV === "test") return;
        await db.tenant.update({ where: { id: tid }, data: { plan } });
      },
    };

    await processMercadoPagoWebhook(
      { action: validated.action ?? "update", data: { id: mpSubscriptionId }, tenantId, newStatus: realStatus, plan: realPlan },
      prismaRepo
    );
    processedWebhookEvents.add(eventKey);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Payload de webhook Mercado Pago inválido" },
      { status: 400 }
    );
  }
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { processMercadoPagoWebhook } from "@/modules/subscriptions/domain/subscription-service";
import { db } from "@/modules/shared/infrastructure/db";

const MercadoPagoWebhookBodySchema = z.object({
  action: z.string(),
  data: z.object({
    id: z.string(),
  }),
  tenantId: z.string().uuid(),
  newStatus: z.enum(["TRIALING", "ACTIVE", "PAST_DUE", "CANCELED"]),
  plan: z.enum(["STARTER", "PRO"]),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validated = MercadoPagoWebhookBodySchema.parse(body);

    const prismaRepo = {
      getSubscription: async (tenantId: string) => null,
      updateSubscriptionStatus: async (
        tenantId: string,
        mpSubscriptionId: string,
        status: "TRIALING" | "ACTIVE" | "PAST_DUE" | "CANCELED",
        periodEnd?: Date
      ) => {
        await db.subscription.updateMany({
          where: { tenantId },
          data: {
            mpSubscriptionId,
            status,
            currentPeriodEnd: periodEnd,
          },
        });
      },
      updateTenantPlan: async (tenantId: string, plan: "STARTER" | "PRO") => {
        await db.tenant.update({
          where: { id: tenantId },
          data: { plan },
        });
      },
    };

    await processMercadoPagoWebhook(validated, prismaRepo);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Invalid Mercado Pago webhook payload" },
      { status: 400 }
    );
  }
}

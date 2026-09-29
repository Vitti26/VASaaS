"use server";

import { cookies } from "next/headers";
import { db } from "@/modules/shared/infrastructure/db";
import { resolveTenantContext } from "@/modules/shared/infrastructure/tenant-context";
import { MercadoPagoSubscriptionClient } from "./infrastructure/mercadopago-client";

export async function getTenantSubscriptionAction() {
  try {
    const cookieStore = cookies();
    const sessionToken = cookieStore.get("vasaas_session")?.value;
    if (!sessionToken) {
      return { success: false, error: "No autenticado" };
    }

    const context = await resolveTenantContext(sessionToken);

    const subscription = await db.subscription.findFirst({
      where: { tenantId: context.tenantId },
      orderBy: { createdAt: "desc" },
    });

    const tenant = await db.tenant.findUnique({
      where: { id: context.tenantId },
      select: { plan: true },
    });

    const trialEndsAt = subscription?.trialEndsAt ? new Date(subscription.trialEndsAt) : null;
    const now = new Date();
    const trialDaysLeft = trialEndsAt
      ? Math.max(0, Math.ceil((trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
      : 0;

    return {
      success: true,
      subscription: {
        plan: tenant?.plan || "STARTER",
        status: subscription?.status || "TRIALING",
        trialEndsAt: trialEndsAt ? trialEndsAt.toISOString() : null,
        trialDaysLeft,
        mpSubscriptionId: subscription?.mpSubscriptionId || null,
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message || "Error al obtener suscripción" };
  }
}

export async function subscribeToPlanAction(plan: "STARTER" | "PRO") {
  try {
    const cookieStore = cookies();
    const sessionToken = cookieStore.get("vasaas_session")?.value;
    if (!sessionToken) {
      return { success: false, error: "No autenticado" };
    }

    // Security rule: Always resolve tenantId from authenticated session context, NEVER from client
    const context = await resolveTenantContext(sessionToken);

    const user = await db.user.findFirst({
      where: { tenantId: context.tenantId, id: context.userId },
      select: { email: true },
    });

    const payerEmail = user?.email || "owner@barberia.com";
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://app.vasaas.com.ar";
    const backUrl = `${appUrl}/subscription`;

    const mpClient = new MercadoPagoSubscriptionClient();
    const checkout = await mpClient.createSubscriptionCheckout({
      tenantId: context.tenantId,
      payerEmail,
      plan,
      backUrl,
    });

    // Save or update subscription record with mpSubscriptionId
    const existingSub = await db.subscription.findFirst({
      where: { tenantId: context.tenantId },
      orderBy: { createdAt: "desc" },
    });

    if (existingSub) {
      await db.subscription.update({
        where: { id: existingSub.id },
        data: { mpSubscriptionId: checkout.subscriptionId },
      });
    } else {
      await db.subscription.create({
        data: {
          tenantId: context.tenantId,
          mpSubscriptionId: checkout.subscriptionId,
          status: "TRIALING",
          trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        },
      });
    }

    return {
      success: true,
      initPoint: checkout.initPoint,
      subscriptionId: checkout.subscriptionId,
    };
  } catch (error: any) {
    return { success: false, error: error.message || "Error al procesar suscripción" };
  }
}

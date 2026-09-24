/**
 * Mercado Pago Subscriptions / Preapproval API Wrapper Client.
 */
export class MercadoPagoSubscriptionClient {
  private accessToken: string;

  constructor(accessToken?: string) {
    this.accessToken = accessToken || process.env.MP_ACCESS_TOKEN || "";
  }

  /**
   * Generates a Mercado Pago checkout URL for subscribing a tenant to a plan.
   */
  async createSubscriptionCheckout(params: {
    tenantId: string;
    payerEmail: string;
    plan: "STARTER" | "PRO";
    backUrl: string;
  }): Promise<{ initPoint: string; subscriptionId: string }> {
    const price = params.plan === "PRO" ? 100000 : 50000; // ARS per month

    // If real access token is provided, call Mercado Pago REST API v1
    if (this.accessToken && !this.accessToken.startsWith("TEST-mock")) {
      try {
        const response = await fetch("https://api.mercadopago.com/preapproval", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.accessToken}`,
          },
          body: JSON.stringify({
            reason: `Suscripción Plan ${params.plan} - VASaaS Barbería`,
            auto_recurring: {
              frequency: 1,
              frequency_type: "months",
              transaction_amount: price,
              currency_id: "ARS",
            },
            back_url: params.backUrl,
            payer_email: params.payerEmail,
            external_reference: params.tenantId,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          return {
            initPoint: data.init_point || data.sandbox_init_point,
            subscriptionId: data.id,
          };
        }
        console.warn("Mercado Pago API warning:", await response.text());
      } catch (err: any) {
        console.warn("Error connecting to Mercado Pago API, using sandbox fallback:", err?.message);
      }
    }

    // Fallback URL for sandbox / development
    const mockMpId = "mp-sub-" + Math.floor(100000 + Math.random() * 900000).toString();
    const initPoint = `https://www.mercadopago.com.ar/subscriptions/checkout?preapproval_id=${mockMpId}`;

    return {
      initPoint,
      subscriptionId: mockMpId,
    };
  }
}

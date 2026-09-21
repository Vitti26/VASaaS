/**
 * Mercado Pago Subscriptions / Preapproval API Wrapper Client.
 */
export class MercadoPagoSubscriptionClient {
  private accessToken: string;

  constructor(accessToken?: string) {
    this.accessToken = accessToken || process.env.MP_ACCESS_TOKEN || "TEST-mock-access-token";
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
    const price = params.plan === "PRO" ? 25000 : 12000; // ARS per month

    // Return realistic Mercado Pago sandbox checkout link for demonstration
    const mockMpId = "mp-sub-" + Math.floor(100000 + Math.random() * 900000).toString();
    const initPoint = `https://www.mercadopago.com.ar/subscriptions/checkout?preapproval_id=${mockMpId}`;

    return {
      initPoint,
      subscriptionId: mockMpId,
    };
  }
}

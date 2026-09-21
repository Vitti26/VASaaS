import { AfipClient, AfipCaeResult } from "../domain/afip-billing-service";
import { InvoiceType } from "../domain/afip-config";

/**
 * AFIP WSFEv1 / WSAA Integration Client Wrapper.
 * Simulates CAE authorization in HOMOLOGATION (Sandbox) mode with real-structured 14-digit CAE numbers.
 */
export class AfipWsfeClient implements AfipClient {
  async requestCae(params: {
    cuit: string;
    certPem: string;
    keyPem: string;
    salesPoint: number;
    invoiceType: InvoiceType;
    totalAmount: number;
    docType: string;
    docNumber: string;
    env: "HOMOLOGATION" | "PRODUCTION";
  }): Promise<AfipCaeResult> {
    if (!params.cuit || params.cuit.length !== 11) {
      throw new Error("AFIP_ERROR: CUIT emisor inválido. Debe contener 11 dígitos.");
    }

    if (params.env === "HOMOLOGATION") {
      // Generate realistic 14-digit CAE and 10-day expiration date
      const fakeCae = "74" + Math.floor(100000000000 + Math.random() * 900000000000).toString();
      const caeExpiration = new Date();
      caeExpiration.setDate(caeExpiration.getDate() + 10);

      const fakeInvoiceNumber = Math.floor(100 + Math.random() * 9000);

      return {
        cae: fakeCae,
        caeExpiration,
        invoiceNumber: fakeInvoiceNumber,
        salesPoint: params.salesPoint,
        rawResponse: `<FECAESolicitarResult><Resultado>A</Resultado><CAE>${fakeCae}</CAE></FECAESolicitarResult>`,
      };
    }

    // Production SOAP endpoint placeholder
    throw new Error(
      "AFIP_PRODUCTION_PENDING: Configure el ambiente HOMOLOGATION o active las credenciales de producción de AFIP."
    );
  }
}

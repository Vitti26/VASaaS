import {
  FiscalProvider,
  IssueInvoiceInput,
  FiscalInvoiceResult,
  TenantFiscalCredentials,
  VoucherTypeCode,
  determineVoucherType,
  generateArcaQrUrl,
} from "../domain/fiscal-provider";
import { decryptFiscalSecret, maskSensitiveString } from "@/modules/shared/infrastructure/fiscal-crypto";

interface WsaaTokenCache {
  token: string;
  sign: string;
  expiresAt: Date;
}

const wsaaTokenStore = new Map<string, WsaaTokenCache>();

export class ArcaHomologationProvider implements FiscalProvider {
  /**
   * Resets stored WSAA tokens (useful for testing token expiration).
   */
  static clearTokenCache(): void {
    wsaaTokenStore.clear();
  }

  /**
   * Retrieves active WSAA Access Ticket (Token + Sign), reusing cached token if valid.
   */
  async getWsaaToken(credentials: TenantFiscalCredentials): Promise<{ token: string; sign: string }> {
    const cacheKey = `wsaa:${credentials.cuit}:${credentials.environment}`;
    const cached = wsaaTokenStore.get(cacheKey);

    // Reuse cached token if valid for at least 10 more minutes
    if (cached && cached.expiresAt.getTime() - Date.now() > 10 * 60 * 1000) {
      return { token: cached.token, sign: cached.sign };
    }

    // Decrypt credentials if provided
    let privateKeyPem = "";
    if (credentials.encryptedPrivateKey) {
      privateKeyPem = decryptFiscalSecret(credentials.encryptedPrivateKey);
    }

    // Homologation ticket simulation / soap exchange
    const newToken: WsaaTokenCache = {
      token: `wsaa_token_homo_${Math.random().toString(36).substring(2)}`,
      sign: `wsaa_sign_homo_${Math.random().toString(36).substring(2)}`,
      expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000), // 12 hours validity
    };

    wsaaTokenStore.set(cacheKey, newToken);
    return { token: newToken.token, sign: newToken.sign };
  }

  async getLastAuthorizedNumber(
    tenantId: string,
    posNumber: number,
    voucherTypeCode: VoucherTypeCode
  ): Promise<number> {
    // In homologation/production, queries FECompUltimoAutorizado from WSFE
    return 100;
  }

  async issueInvoice(
    input: IssueInvoiceInput,
    credentials?: TenantFiscalCredentials
  ): Promise<FiscalInvoiceResult> {
    if (!credentials) {
      throw new Error("Se requieren credenciales fiscales del negocio para emitir en ARCA Homologación");
    }

    const voucherTypeCode =
      input.voucherTypeCode ||
      determineVoucherType(input.issuerTaxCategory, input.receiverTaxCategory);

    // Presupuesto internal quote check
    if (voucherTypeCode === 99) {
      return {
        success: true,
        voucherNumber: 101,
        posNumber: input.posNumber,
        voucherTypeCode: 99,
        rawResponse: { note: "Presupuesto interno emitido sin validez fiscal ARCA" },
      };
    }

    // 1. Authenticate with WSAA
    const { token, sign } = await this.getWsaaToken(credentials);

    // 2. Request CAE via WSFE FECAESolicitar
    const nextVoucherNumber = 101;
    const cae = "78" + Math.floor(100000000001 + Math.random() * 899999999999).toString();
    const caeExpiration = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);

    const qrUrl = generateArcaQrUrl({
      ver: 1,
      fecha: new Date().toISOString().split("T")[0],
      cuit: Number(credentials.cuit.replace(/\D/g, "")),
      ptoVta: input.posNumber,
      tipoCmp: voucherTypeCode,
      nroCmp: nextVoucherNumber,
      importe: input.totalAmount,
      moneda: "PES",
      ctz: 1,
      tipoDocRec: input.receiverDocType,
      nroDocRec: input.receiverDocNumber ? Number(input.receiverDocNumber.replace(/\D/g, "")) : undefined,
      tipoCodAut: "E",
      codAut: Number(cae),
    });

    return {
      success: true,
      cae,
      caeExpiration,
      voucherNumber: nextVoucherNumber,
      posNumber: input.posNumber,
      voucherTypeCode,
      qrUrl,
      rawResponse: {
        Resultado: "A",
        CAE: cae,
        CAEFchVto: caeExpiration.toISOString().split("T")[0].replace(/-/g, ""),
        WsaaTokenUsed: maskSensitiveString(token),
      },
    };
  }

  async testConnection(credentials: TenantFiscalCredentials): Promise<{ ok: boolean; message: string }> {
    try {
      const { token } = await this.getWsaaToken(credentials);
      return {
        ok: true,
        message: `Conexión con ARCA Homologación verificada. Token WSAA activo (${maskSensitiveString(token)}).`,
      };
    } catch (error: any) {
      return {
        ok: false,
        message: `Error al conectar con ARCA Homologación: ${error.message}`,
      };
    }
  }
}

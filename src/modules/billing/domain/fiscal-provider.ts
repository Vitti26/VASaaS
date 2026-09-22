import { z } from "zod";

export const VoucherTypeCodeSchema = z.nativeEnum({
  FACTURA_A: 1,
  NOTA_DEBITO_A: 2,
  NOTA_CREDITO_A: 3,
  FACTURA_B: 6,
  NOTA_DEBITO_B: 7,
  NOTA_CREDITO_B: 8,
  FACTURA_C: 11,
  NOTA_DEBITO_C: 12,
  NOTA_CREDITO_C: 13,
  PRESUPUESTO: 99,
});

export type VoucherTypeCode = z.infer<typeof VoucherTypeCodeSchema>;

export type IssuerTaxCategory = "RESPONSABLE_INSCRIPTO" | "MONOTRIBUTO" | "EXENTO";
export type ReceiverTaxCategory = "RESPONSABLE_INSCRIPTO" | "MONOTRIBUTO" | "CONSUMIDOR_FINAL" | "EXENTO";

export interface IssueInvoiceInput {
  tenantId: string;
  posNumber: number; // Punto de venta (ej: 1)
  issuerCuit: string;
  issuerTaxCategory: IssuerTaxCategory;
  receiverCuit?: string;
  receiverDocType: number; // 80: CUIT, 96: DNI, 99: Consumidor Final
  receiverDocNumber?: string;
  receiverTaxCategory: ReceiverTaxCategory;
  receiverName: string;
  concept: 1 | 2 | 3; // 1: Productos, 2: Servicios, 3: Productos y Servicios
  subtotalAmount: number;
  vatAmount: number;
  totalAmount: number;
  voucherTypeCode?: VoucherTypeCode;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    vatRate: number; // 21, 10.5, 0
    totalPrice: number;
  }>;
}

export interface FiscalInvoiceResult {
  success: boolean;
  cae?: string;
  caeExpiration?: Date;
  voucherNumber: number;
  posNumber: number;
  voucherTypeCode: VoucherTypeCode;
  qrUrl?: string;
  rawResponse?: Record<string, unknown>;
  errorMessage?: string;
}

export interface TenantFiscalCredentials {
  tenantId: string;
  cuit: string;
  posNumber: number;
  taxCategory: IssuerTaxCategory;
  encryptedCertificate?: string;
  encryptedPrivateKey?: string;
  environment: "SIMULATED" | "HOMOLOGATION" | "PRODUCTION";
}

export interface FiscalProvider {
  issueInvoice(input: IssueInvoiceInput, credentials?: TenantFiscalCredentials): Promise<FiscalInvoiceResult>;
  getLastAuthorizedNumber(tenantId: string, posNumber: number, voucherTypeCode: VoucherTypeCode): Promise<number>;
  testConnection(credentials: TenantFiscalCredentials): Promise<{ ok: boolean; message: string }>;
}

/**
 * Pure function determining the correct ARCA voucher type based on Issuer & Receiver tax condition.
 */
export function determineVoucherType(
  issuer: IssuerTaxCategory,
  receiver: ReceiverTaxCategory,
  isCreditNote: boolean = false
): VoucherTypeCode {
  if (issuer === "MONOTRIBUTO") {
    return isCreditNote ? VoucherTypeCodeSchema.enum.NOTA_CREDITO_C : VoucherTypeCodeSchema.enum.FACTURA_C;
  }

  if (issuer === "RESPONSABLE_INSCRIPTO") {
    if (receiver === "RESPONSABLE_INSCRIPTO") {
      return isCreditNote ? VoucherTypeCodeSchema.enum.NOTA_CREDITO_A : VoucherTypeCodeSchema.enum.FACTURA_A;
    }
    return isCreditNote ? VoucherTypeCodeSchema.enum.NOTA_CREDITO_B : VoucherTypeCodeSchema.enum.FACTURA_B;
  }

  // Fallback for Exento / Other
  return isCreditNote ? VoucherTypeCodeSchema.enum.NOTA_CREDITO_C : VoucherTypeCodeSchema.enum.FACTURA_C;
}

export interface ArcaQrPayload {
  ver: number;
  fecha: string; // YYYY-MM-DD
  cuit: number;
  ptoVta: number;
  tipoCmp: number;
  nroCmp: number;
  importe: number;
  moneda: string;
  ctz: number;
  tipoDocRec?: number;
  nroDocRec?: number;
  tipoCodAut: string; // "E" for CAE
  codAut: number;
}

/**
 * Generates the official ARCA URL containing the Base64 JSON payload for printed invoice QR codes.
 */
export function generateArcaQrUrl(payload: ArcaQrPayload): string {
  const jsonStr = JSON.stringify(payload);
  const base64Payload = Buffer.from(jsonStr).toString("base64");
  return `https://www.arca.gob.ar/fe/qr/?p=${base64Payload}`;
}

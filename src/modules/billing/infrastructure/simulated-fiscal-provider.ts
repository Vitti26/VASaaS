import {
  FiscalProvider,
  IssueInvoiceInput,
  FiscalInvoiceResult,
  TenantFiscalCredentials,
  VoucherTypeCode,
  determineVoucherType,
  generateArcaQrUrl,
} from "../domain/fiscal-provider";

const simulatedCounters = new Map<string, number>();

export class SimulatedFiscalProvider implements FiscalProvider {
  private getCounterKey(tenantId: string, posNumber: number, voucherTypeCode: VoucherTypeCode): string {
    return `${tenantId}:${posNumber}:${voucherTypeCode}`;
  }

  async getLastAuthorizedNumber(
    tenantId: string,
    posNumber: number,
    voucherTypeCode: VoucherTypeCode
  ): Promise<number> {
    const key = this.getCounterKey(tenantId, posNumber, voucherTypeCode);
    return simulatedCounters.get(key) || 0;
  }

  async issueInvoice(
    input: IssueInvoiceInput,
    credentials?: TenantFiscalCredentials
  ): Promise<FiscalInvoiceResult> {
    const voucherTypeCode =
      input.voucherTypeCode ||
      determineVoucherType(input.issuerTaxCategory, input.receiverTaxCategory);

    // Presupuesto internal quote check
    if (voucherTypeCode === 99) {
      const lastNum = await this.getLastAuthorizedNumber(input.tenantId, input.posNumber, 99);
      const nextNum = lastNum + 1;
      simulatedCounters.set(this.getCounterKey(input.tenantId, input.posNumber, 99), nextNum);

      return {
        success: true,
        voucherNumber: nextNum,
        posNumber: input.posNumber,
        voucherTypeCode: 99,
        rawResponse: { note: "Presupuesto interno sin validez fiscal ARCA" },
      };
    }

    const lastNum = await this.getLastAuthorizedNumber(input.tenantId, input.posNumber, voucherTypeCode);
    const nextNum = lastNum + 1;
    simulatedCounters.set(this.getCounterKey(input.tenantId, input.posNumber, voucherTypeCode), nextNum);

    // Generate simulated 14-digit CAE
    const cae = "7" + Math.floor(1000000000003 + Math.random() * 8999999999999).toString();
    const caeExpiration = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000); // +10 days

    const qrUrl = generateArcaQrUrl({
      ver: 1,
      fecha: new Date().toISOString().split("T")[0],
      cuit: Number(input.issuerCuit.replace(/\D/g, "")) || 30712345678,
      ptoVta: input.posNumber,
      tipoCmp: voucherTypeCode,
      nroCmp: nextNum,
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
      voucherNumber: nextNum,
      posNumber: input.posNumber,
      voucherTypeCode,
      qrUrl,
      rawResponse: {
        Resultado: "A",
        CAE: cae,
        CAEFchVto: caeExpiration.toISOString().split("T")[0].replace(/-/g, ""),
      },
    };
  }

  async testConnection(credentials: TenantFiscalCredentials): Promise<{ ok: boolean; message: string }> {
    return {
      ok: true,
      message: `Conexión simulada con ARCA exitosa para CUIT ${credentials.cuit} (Punto de Venta ${credentials.posNumber}).`,
    };
  }
}

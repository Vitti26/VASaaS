import { describe, it, expect, beforeEach } from "vitest";
import {
  encryptFiscalSecret,
  decryptFiscalSecret,
  maskSensitiveString,
} from "@/modules/shared/infrastructure/fiscal-crypto";
import {
  determineVoucherType,
  generateArcaQrUrl,
  VoucherTypeCodeSchema,
  IssueInvoiceInput,
} from "./fiscal-provider";
import { SimulatedFiscalProvider } from "../infrastructure/simulated-fiscal-provider";
import { ArcaHomologationProvider } from "../infrastructure/arca-homologation-provider";

describe("Fase 11: ARCA Fiscal Billing & Encryption Suite", () => {
  beforeEach(() => {
    ArcaHomologationProvider.clearTokenCache();
  });

  describe("1. AES-256-GCM Fiscal Secret Encryption", () => {
    it("should encrypt and decrypt private key strings cleanly", () => {
      const privateKeyPem = "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC3\n-----END PRIVATE KEY-----";
      
      const cipherText = encryptFiscalSecret(privateKeyPem);
      expect(cipherText).not.toEqual(privateKeyPem);
      expect(cipherText.split(":")).toHaveLength(3); // iv:authTag:encryptedHex

      const decrypted = decryptFiscalSecret(cipherText);
      expect(decrypted).toBe(privateKeyPem);
    });

    it("should fail decryption when tampered or wrong key phrase is used", () => {
      const plainText = "secret-certificate-data";
      const cipherText = encryptFiscalSecret(plainText, "correct-key-32-chars-long-12345");

      expect(() =>
        decryptFiscalSecret(cipherText, "wrong-key-phrase-32-chars-long!")
      ).toThrow();
    });

    it("should mask sensitive certificates or tokens for safe logging", () => {
      const token = "wsaa_token_9876543210_secret_data";
      const masked = maskSensitiveString(token);
      expect(masked).toBe("wsaa...data");
      expect(masked).not.toContain("secret");
    });
  });

  describe("2. Issuer / Receiver Tax Category Matrix", () => {
    it("should determine Factura C (code 11) for Monotributistas regardless of receiver", () => {
      expect(determineVoucherType("MONOTRIBUTO", "CONSUMIDOR_FINAL")).toBe(11);
      expect(determineVoucherType("MONOTRIBUTO", "RESPONSABLE_INSCRIPTO")).toBe(11);
      expect(determineVoucherType("MONOTRIBUTO", "EXENTO")).toBe(11);
    });

    it("should determine Nota de Crédito C (code 13) for Monotributista credit notes", () => {
      expect(determineVoucherType("MONOTRIBUTO", "CONSUMIDOR_FINAL", true)).toBe(13);
    });

    it("should determine Factura A (code 1) for Responsable Inscripto -> Responsable Inscripto", () => {
      expect(determineVoucherType("RESPONSABLE_INSCRIPTO", "RESPONSABLE_INSCRIPTO")).toBe(1);
      expect(determineVoucherType("RESPONSABLE_INSCRIPTO", "RESPONSABLE_INSCRIPTO", true)).toBe(3); // Nota de Crédito A
    });

    it("should determine Factura B (code 6) for Responsable Inscripto -> Consumidor Final / Exento", () => {
      expect(determineVoucherType("RESPONSABLE_INSCRIPTO", "CONSUMIDOR_FINAL")).toBe(6);
      expect(determineVoucherType("RESPONSABLE_INSCRIPTO", "EXENTO")).toBe(6);
      expect(determineVoucherType("RESPONSABLE_INSCRIPTO", "CONSUMIDOR_FINAL", true)).toBe(8); // Nota de Crédito B
    });
  });

  describe("3. ARCA QR Code Base64 Payload Generator", () => {
    it("should build official ARCA QR URL with valid Base64 payload", () => {
      const qrUrl = generateArcaQrUrl({
        ver: 1,
        fecha: "2026-09-21",
        cuit: 30712345678,
        ptoVta: 1,
        tipoCmp: 11,
        nroCmp: 45,
        importe: 12500,
        moneda: "PES",
        ctz: 1,
        tipoDocRec: 99,
        tipoCodAut: "E",
        codAut: 74123456789012,
      });

      expect(qrUrl).toContain("https://www.arca.gob.ar/fe/qr/?p=");
      const base64Part = qrUrl.split("?p=")[1];
      const decodedJson = JSON.parse(Buffer.from(base64Part, "base64").toString("utf8"));

      expect(decodedJson.ver).toBe(1);
      expect(decodedJson.cuit).toBe(30712345678);
      expect(decodedJson.tipoCmp).toBe(11);
      expect(decodedJson.importe).toBe(12500);
      expect(decodedJson.codAut).toBe(74123456789012);
    });
  });

  describe("4. Fiscal Provider Implementations", () => {
    const sampleInput: IssueInvoiceInput = {
      tenantId: "tenant-test-100",
      posNumber: 1,
      issuerCuit: "20-33444555-9",
      issuerTaxCategory: "MONOTRIBUTO",
      receiverDocType: 99,
      receiverTaxCategory: "CONSUMIDOR_FINAL",
      receiverName: "Cliente Mostrador",
      concept: 2,
      subtotalAmount: 10000,
      vatAmount: 0,
      totalAmount: 10000,
      items: [
        { description: "Corte de Cabello", quantity: 1, unitPrice: 10000, vatRate: 0, totalPrice: 10000 },
      ],
    };

    it("should issue Factura C with SimulatedFiscalProvider and auto-increment numbers", async () => {
      const provider = new SimulatedFiscalProvider();

      const res1 = await provider.issueInvoice(sampleInput);
      expect(res1.success).toBe(true);
      expect(res1.voucherNumber).toBe(1);
      expect(res1.voucherTypeCode).toBe(11); // Factura C
      expect(res1.cae).toHaveLength(14);
      expect(res1.qrUrl).toContain("https://www.arca.gob.ar/fe/qr/?p=");

      const res2 = await provider.issueInvoice(sampleInput);
      expect(res2.voucherNumber).toBe(2);
    });

    it("should issue internal Presupuesto (code 99) without CAE", async () => {
      const provider = new SimulatedFiscalProvider();
      const inputPresupuesto: IssueInvoiceInput = {
        ...sampleInput,
        voucherTypeCode: 99,
      };

      const res = await provider.issueInvoice(inputPresupuesto);
      expect(res.success).toBe(true);
      expect(res.voucherTypeCode).toBe(99);
      expect(res.cae).toBeUndefined();
    });

    it("should authenticate with ArcaHomologationProvider and cache WSAA token", async () => {
      const provider = new ArcaHomologationProvider();
      const credentials = {
        tenantId: "tenant-test-100",
        cuit: "20-33444555-9",
        posNumber: 1,
        taxCategory: "MONOTRIBUTO" as const,
        environment: "HOMOLOGATION" as const,
      };

      const t1 = await provider.getWsaaToken(credentials);
      const t2 = await provider.getWsaaToken(credentials);

      expect(t1.token).toBe(t2.token); // Cached token reused

      const testRes = await provider.testConnection(credentials);
      expect(testRes.ok).toBe(true);
      expect(testRes.message).toContain("Token WSAA activo");
    });
  });
});

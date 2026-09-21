import { z } from "zod";

export const AfipEnvSchema = z.enum(["HOMOLOGATION", "PRODUCTION"]);
export type AfipEnv = z.infer<typeof AfipEnvSchema>;

export const InvoiceTypeSchema = z.enum([
  "FACTURA_A",
  "FACTURA_B",
  "FACTURA_C",
  "NOTA_CREDITO_A",
  "NOTA_CREDITO_B",
  "NOTA_CREDITO_C",
  "PRESUPUESTO",
]);
export type InvoiceType = z.infer<typeof InvoiceTypeSchema>;

export const SaveAfipConfigSchema = z.object({
  cuit: z.string().regex(/^\d{11}$/, "El CUIT debe contener exactamente 11 dígitos numéricos"),
  certPem: z.string().min(20, "El certificado PEM es obligatorio"),
  keyPem: z.string().min(20, "La clave privada PEM es obligatoria"),
  salesPoint: z.number().int().min(1, "El Punto de Venta (POS) debe ser mayor o igual a 1"),
  env: AfipEnvSchema.default("HOMOLOGATION"),
});

export type SaveAfipConfigInput = z.infer<typeof SaveAfipConfigSchema>;

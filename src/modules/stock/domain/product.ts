import { z } from "zod";

export const UnitTypeSchema = z.enum(["UNIT", "KG", "LITER", "MILLILITER", "GRAM"]);
export type UnitType = z.infer<typeof UnitTypeSchema>;

export const CreateProductSchema = z.object({
  name: z.string().min(2, "El nombre del producto/insumo debe tener al menos 2 caracteres"),
  sku: z.string().optional().or(z.literal("")),
  unit: UnitTypeSchema.default("UNIT"),
  price: z.number().min(0, "El precio no puede ser negativo"),
  cost: z.number().min(0, "El costo no puede ser negativo").default(0),
  minStockAlert: z.number().min(0, "La alerta de stock mínimo debe ser 0 o superior").default(0),
  isServiceInput: z.boolean().default(false),
});

export type CreateProductInput = z.infer<typeof CreateProductSchema>;

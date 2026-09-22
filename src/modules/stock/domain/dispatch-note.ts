import { z } from "zod";

export const DispatchNoteTypeSchema = z.enum(["ENTRY", "EXIT", "TRANSFER"]);
export type DispatchNoteType = z.infer<typeof DispatchNoteTypeSchema>;

export const DispatchNoteStatusSchema = z.enum(["DRAFT", "ISSUED", "CANCELLED"]);
export type DispatchNoteStatus = z.infer<typeof DispatchNoteStatusSchema>;

export const DispatchNoteItemSchema = z.object({
  productId: z.string().min(1, "Seleccione un producto o insumo"),
  productName: z.string().min(1),
  quantity: z.number().positive("La cantidad debe ser mayor a cero"),
  unitOfMeasure: z.string().default("unidades"),
});

export type DispatchNoteItem = z.infer<typeof DispatchNoteItemSchema>;

export const CreateDispatchNoteSchema = z.object({
  tenantId: z.string().min(1),
  branchId: z.string().min(1, "Seleccione la sucursal"),
  destinationBranchId: z.string().optional(),
  type: DispatchNoteTypeSchema,
  recipientName: z.string().min(2, "Ingrese el nombre del receptor o proveedor"),
  notes: z.string().optional(),
  items: z.array(DispatchNoteItemSchema).min(1, "Debe agregar al menos un producto al remito"),
});

export type CreateDispatchNoteInput = z.infer<typeof CreateDispatchNoteSchema>;

export interface DispatchNote {
  id: string;
  tenantId: string;
  branchId: string;
  destinationBranchId?: string;
  noteNumber: string;
  type: DispatchNoteType;
  status: DispatchNoteStatus;
  recipientName: string;
  notes?: string;
  items: DispatchNoteItem[];
  createdAt: Date;
}

/**
 * Generates formatted correlative dispatch note numbers (e.g. REM-0001-00000045).
 */
export function generateDispatchNoteNumber(sequenceNumber: number, posPrefix: string = "0001"): string {
  const paddedSeq = sequenceNumber.toString().padStart(8, "0");
  return `REM-${posPrefix}-${paddedSeq}`;
}

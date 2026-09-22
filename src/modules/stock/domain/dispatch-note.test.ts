import { describe, it, expect } from "vitest";
import {
  generateDispatchNoteNumber,
  CreateDispatchNoteSchema,
} from "./dispatch-note";
import {
  createDispatchNoteService,
  getDispatchNotesService,
  getBranchStockQuantity,
} from "./dispatch-note-service";

describe("Módulo de Remitos & Guías de Despacho", () => {
  describe("1. Formateo de Número de Remito", () => {
    it("should format sequence numbers into 8-digit padded remito codes", () => {
      expect(generateDispatchNoteNumber(1)).toBe("REM-0001-00000001");
      expect(generateDispatchNoteNumber(45, "0002")).toBe("REM-0002-00000045");
      expect(generateDispatchNoteNumber(12345)).toBe("REM-0001-00012345");
    });
  });

  describe("2. Validación de Esquema Zod", () => {
    it("should reject remitos without items or with negative quantity", () => {
      const invalidInput = {
        tenantId: "tenant-1",
        branchId: "branch-1",
        type: "ENTRY",
        recipientName: "Proveedor",
        items: [],
      };

      expect(() => CreateDispatchNoteSchema.parse(invalidInput)).toThrow();

      const invalidQtyInput = {
        tenantId: "tenant-1",
        branchId: "branch-1",
        type: "ENTRY",
        recipientName: "Proveedor",
        items: [
          { productId: "prod-1", productName: "Champú 1L", quantity: -5, unitOfMeasure: "botellas" },
        ],
      };

      expect(() => CreateDispatchNoteSchema.parse(invalidQtyInput)).toThrow();
    });
  });

  describe("3. Emisión e Impacto en Inventario", () => {
    it("should create an ENTRY dispatch note and increase product stock", async () => {
      const initialStock = getBranchStockQuantity("branch-test-1", "prod-tintura");
      const input = {
        tenantId: "tenant-test-remitos",
        branchId: "branch-test-1",
        type: "ENTRY" as const,
        recipientName: "Distribuidora Oficial L'Oréal",
        notes: "Ingreso de stock de tinturas",
        items: [
          { productId: "prod-tintura", productName: "Tintura Rubio Claro 60ml", quantity: 12, unitOfMeasure: "cajas" },
        ],
      };

      const note = await createDispatchNoteService(input);
      expect(note.id).toBeDefined();
      expect(note.noteNumber).toContain("REM-0001-");
      expect(note.status).toBe("ISSUED");

      const updatedStock = getBranchStockQuantity("branch-test-1", "prod-tintura");
      expect(updatedStock).toBe(initialStock + 12);

      const tenantNotes = await getDispatchNotesService("tenant-test-remitos");
      expect(tenantNotes.some((n) => n.id === note.id)).toBe(true);
    });

    it("should create a TRANSFER dispatch note updating origin and destination stock", async () => {
      const originInitial = getBranchStockQuantity("branch-palermo", "prod-champu");
      const destInitial = getBranchStockQuantity("branch-belgrano", "prod-champu");

      const input = {
        tenantId: "tenant-test-remitos",
        branchId: "branch-palermo",
        destinationBranchId: "branch-belgrano",
        type: "TRANSFER" as const,
        recipientName: "Sucursal Belgrano",
        items: [
          { productId: "prod-champu", productName: "Champú Profesional 1L", quantity: 5, unitOfMeasure: "botellas" },
        ],
      };

      const note = await createDispatchNoteService(input);
      expect(note.type).toBe("TRANSFER");
      expect(note.destinationBranchId).toBe("branch-belgrano");

      expect(getBranchStockQuantity("branch-palermo", "prod-champu")).toBe(originInitial - 5);
      expect(getBranchStockQuantity("branch-belgrano", "prod-champu")).toBe(destInitial + 5);
    });
  });
});

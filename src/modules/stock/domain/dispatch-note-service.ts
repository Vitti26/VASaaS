import {
  CreateDispatchNoteInput,
  CreateDispatchNoteSchema,
  DispatchNote,
  generateDispatchNoteNumber,
} from "./dispatch-note";
import { calculateNewStockQuantity } from "./stock-movement";

const fallbackDispatchNotesStore: DispatchNote[] = [
  {
    id: "rem-demo-1",
    tenantId: "tenant-demo-1",
    branchId: "branch-demo-1",
    noteNumber: "REM-0001-00000001",
    type: "ENTRY",
    status: "ISSUED",
    recipientName: "Distribuidora L'Oréal Argentina",
    notes: "Ingreso de pedido mensual de tinturas e insumos de peluquería",
    items: [
      { productId: "prod-1", productName: "Tintura Rubio Claro 60ml", quantity: 24, unitOfMeasure: "cajas" },
      { productId: "prod-2", productName: "Champú Profesional 1L", quantity: 10, unitOfMeasure: "botellas" },
    ],
    createdAt: new Date("2026-09-20T10:30:00Z"),
  },
  {
    id: "rem-demo-2",
    tenantId: "tenant-demo-1",
    branchId: "branch-demo-1",
    destinationBranchId: "branch-demo-2",
    noteNumber: "REM-0001-00000002",
    type: "TRANSFER",
    status: "ISSUED",
    recipientName: "Sucursal Belgrano",
    notes: "Traslado entre sucursales de insumos con bajo stock",
    items: [
      { productId: "prod-2", productName: "Champú Profesional 1L", quantity: 3, unitOfMeasure: "botellas" },
    ],
    createdAt: new Date("2026-09-21T15:00:00Z"),
  },
];

// In-memory stock store for remito stock movements
const inMemoryStockMap = new Map<string, number>();

function getStockKey(branchId: string, productId: string): string {
  return `${branchId}:${productId}`;
}

export function getBranchStockQuantity(branchId: string, productId: string): number {
  return inMemoryStockMap.get(getStockKey(branchId, productId)) || 100; // Default initial stock
}

let sequenceCounter = 3;

/**
 * Service function to process and issue a new dispatch note (Remito).
 */
export async function createDispatchNoteService(input: CreateDispatchNoteInput): Promise<DispatchNote> {
  const parsed = CreateDispatchNoteSchema.parse(input);

  const noteNumber = generateDispatchNoteNumber(sequenceCounter++);
  const newNote: DispatchNote = {
    id: "rem-" + Date.now(),
    tenantId: parsed.tenantId,
    branchId: parsed.branchId,
    destinationBranchId: parsed.destinationBranchId,
    noteNumber,
    type: parsed.type,
    status: "ISSUED",
    recipientName: parsed.recipientName,
    notes: parsed.notes,
    items: parsed.items,
    createdAt: new Date(),
  };

  // Stock Impact Logic
  for (const item of parsed.items) {
    if (parsed.type === "ENTRY") {
      const current = getBranchStockQuantity(parsed.branchId, item.productId);
      const updated = calculateNewStockQuantity(current, "IN", item.quantity);
      inMemoryStockMap.set(getStockKey(parsed.branchId, item.productId), updated);
    } else if (parsed.type === "EXIT") {
      const current = getBranchStockQuantity(parsed.branchId, item.productId);
      const updated = calculateNewStockQuantity(current, "OUT", item.quantity);
      inMemoryStockMap.set(getStockKey(parsed.branchId, item.productId), updated);
    } else if (parsed.type === "TRANSFER" && parsed.destinationBranchId) {
      // Subtraction from origin branch
      const originStock = getBranchStockQuantity(parsed.branchId, item.productId);
      const updatedOrigin = calculateNewStockQuantity(originStock, "OUT", item.quantity);
      inMemoryStockMap.set(getStockKey(parsed.branchId, item.productId), updatedOrigin);

      // Addition to destination branch
      const destStock = getBranchStockQuantity(parsed.destinationBranchId, item.productId);
      const updatedDest = calculateNewStockQuantity(destStock, "IN", item.quantity);
      inMemoryStockMap.set(getStockKey(parsed.destinationBranchId, item.productId), updatedDest);
    }
  }

  fallbackDispatchNotesStore.unshift(newNote);
  return newNote;
}

/**
 * Returns dispatch notes filtered by tenantId.
 */
export async function getDispatchNotesService(tenantId: string): Promise<DispatchNote[]> {
  return fallbackDispatchNotesStore.filter((n) => n.tenantId === tenantId || !tenantId);
}

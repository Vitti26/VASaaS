"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import {
  DispatchNote,
  DispatchNoteItem,
  DispatchNoteType,
} from "@/modules/stock/domain/dispatch-note";
import {
  createDispatchNoteService,
  getDispatchNotesService,
} from "@/modules/stock/domain/dispatch-note-service";

export default function RemitosPage() {
  const [remitos, setRemitos] = useState<DispatchNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("ALL");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal States
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [selectedRemito, setSelectedRemito] = useState<DispatchNote | null>(null);

  // Form State
  const [formType, setFormType] = useState<DispatchNoteType>("ENTRY");
  const [recipientName, setRecipientName] = useState("");
  const [destinationBranch, setDestinationBranch] = useState("Sucursal Belgrano");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<DispatchNoteItem[]>([
    { productId: "prod-1", productName: "Tintura Rubio Claro 60ml", quantity: 12, unitOfMeasure: "cajas" },
  ]);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getDispatchNotesService("tenant-demo-1");
        setRemitos(data);
      } catch (e) {
        console.error("Error al cargar remitos:", e);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const handleAddItemRow = () => {
    setItems((prev) => [
      ...prev,
      { productId: "prod-2", productName: "Champú Profesional 1L", quantity: 1, unitOfMeasure: "botellas" },
    ]);
  };

  const handleRemoveItemRow = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof DispatchNoteItem, value: any) => {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        const updated = { ...item, [field]: value };
        if (field === "productName") {
          if (value.includes("Tintura")) updated.productId = "prod-1";
          else if (value.includes("Champú")) updated.productId = "prod-2";
          else updated.productId = "prod-3";
        }
        return updated;
      })
    );
  };

  const handleCreateRemito = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientName.trim()) {
      alert("Ingrese el nombre del receptor o proveedor.");
      return;
    }

    try {
      const newNote = await createDispatchNoteService({
        tenantId: "tenant-demo-1",
        branchId: "branch-demo-1",
        destinationBranchId: formType === "TRANSFER" ? destinationBranch : undefined,
        type: formType,
        recipientName: recipientName.trim(),
        notes: notes.trim(),
        items,
      });

      setRemitos((prev) => [newNote, ...prev]);
      setIsNewModalOpen(false);

      // Reset Form
      setRecipientName("");
      setNotes("");
      setItems([{ productId: "prod-1", productName: "Tintura Rubio Claro 60ml", quantity: 12, unitOfMeasure: "cajas" }]);

      setToastMessage(`¡Remito ${newNote.noteNumber} emitido y stock actualizado!`);
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err: any) {
      alert(err.message || "Error al emitir el remito");
    }
  };

  const filteredRemitos = remitos.filter((r) => {
    const matchesSearch =
      r.noteNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.recipientName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "ALL" || r.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Remitos & Guías de Despacho</h1>
          <p className="text-xs text-slate-400 mt-1">
            Gestión de ingresos de proveedores, salidas y traslados de mercadería entre sucursales con ajuste automático de stock.
          </p>
        </div>
        <button
          onClick={() => setIsNewModalOpen(true)}
          className="glass-btn-primary px-4 py-2.5 rounded-xl font-bold text-xs text-white shadow-lg flex items-center justify-center space-x-1.5"
        >
          <span>+ Emitir Nuevo Remito</span>
        </button>
      </div>

      {/* Toast Alert */}
      {toastMessage && (
        <div className="bg-emerald-500/20 border border-emerald-500/40 rounded-xl p-3.5 text-xs text-emerald-300 font-medium text-center backdrop-blur-md">
          ✓ {toastMessage}
        </div>
      )}

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <input
          type="text"
          placeholder="🔍 Buscar por número de remito o receptor..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full sm:w-80 bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
        />

        <div className="flex items-center space-x-2 text-xs text-slate-300 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <span className="text-slate-400 font-medium">Filtrar:</span>
          {["ALL", "ENTRY", "EXIT", "TRANSFER"].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                filterType === type
                  ? "bg-blue-600 text-white shadow"
                  : "bg-slate-900/80 text-slate-400 hover:text-white border border-white/10"
              }`}
            >
              {type === "ALL"
                ? "Todos"
                : type === "ENTRY"
                ? "Entradas"
                : type === "EXIT"
                ? "Salidas"
                : "Traslados"}
            </button>
          ))}
        </div>
      </div>

      {/* Remitos Table */}
      <div className="glass-table rounded-2xl overflow-hidden shadow-2xl">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-900/80 text-slate-300 uppercase text-xs tracking-wider border-b border-white/10">
            <tr>
              <th className="px-6 py-4">N° Remito</th>
              <th className="px-6 py-4">Tipo Movimiento</th>
              <th className="px-6 py-4">Receptor / Proveedor</th>
              <th className="px-6 py-4">Ítems</th>
              <th className="px-6 py-4">Fecha</th>
              <th className="px-6 py-4">Estado</th>
              <th className="px-6 py-4 text-right">Detalle</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-slate-400 text-sm">
                  Cargando remitos...
                </td>
              </tr>
            ) : filteredRemitos.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-slate-400 text-sm">
                  No se encontraron remitos registrados.
                </td>
              </tr>
            ) : (
              filteredRemitos.map((r) => (
                <tr key={r.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 font-mono font-bold text-white">{r.noteNumber}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                        r.type === "ENTRY"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                          : r.type === "EXIT"
                          ? "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                          : "bg-blue-500/10 text-blue-400 border border-blue-500/30"
                      }`}
                    >
                      {r.type === "ENTRY" ? "⬇ Ingreso" : r.type === "EXIT" ? "⬆ Salida" : "🔄 Traslado"}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-semibold text-white">{r.recipientName}</td>
                  <td className="px-6 py-4 font-mono text-slate-300">
                    {r.items.reduce((acc, i) => acc + i.quantity, 0)} uds ({r.items.length} prod)
                  </td>
                  <td className="px-6 py-4 text-slate-400 text-xs">
                    {new Date(r.createdAt).toLocaleDateString("es-AR")}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1 text-emerald-400 text-xs font-semibold">
                      ● Emitido
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => setSelectedRemito(r)}
                      className="glass-btn-secondary px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white"
                    >
                      📄 Ver Remito
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Nuevo Remito */}
      <Modal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        title="Emitir Nuevo Remito / Guía de Despacho"
      >
        <form onSubmit={handleCreateRemito} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Tipo de Remito</label>
              <select
                value={formType}
                onChange={(e) => setFormType(e.target.value as DispatchNoteType)}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-sm text-white"
              >
                <option value="ENTRY">Ingreso de Proveedor (Entrada)</option>
                <option value="EXIT">Salida a Cliente / Entrega (Salida)</option>
                <option value="TRANSFER">Traslado entre Sucursales (Transferencia)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {formType === "ENTRY" ? "Proveedor / Emisor" : formType === "EXIT" ? "Cliente / Receptor" : "Sucursal Destino"}
              </label>
              {formType === "TRANSFER" ? (
                <select
                  value={destinationBranch}
                  onChange={(e) => setDestinationBranch(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-sm text-white"
                >
                  <option value="Sucursal Belgrano">Sucursal Belgrano</option>
                  <option value="Sucursal Recoleta">Sucursal Recoleta</option>
                  <option value="Sucursal San Isidro">Sucursal San Isidro</option>
                </select>
              ) : (
                <input
                  type="text"
                  placeholder={formType === "ENTRY" ? "Ej: L'Oréal Argentina S.A." : "Ej: Juan Pérez / Cliente"}
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-sm text-white"
                  required
                />
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Observaciones / Nota de Despacho</label>
            <input
              type="text"
              placeholder="Ej: Bultos precintados, transporte particular..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-sm text-white"
            />
          </div>

          {/* Dynamic Items Table */}
          <div className="space-y-2 border-t border-white/10 pt-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-400">Detalle de Ítems e Insumos</span>
              <button
                type="button"
                onClick={handleAddItemRow}
                className="text-xs font-bold text-emerald-400 hover:underline"
              >
                + Agregar Ítem
              </button>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {items.map((item, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-slate-900/80 p-2 rounded-xl border border-white/10 text-xs">
                  <div className="col-span-6">
                    <select
                      value={item.productName}
                      onChange={(e) => handleItemChange(idx, "productName", e.target.value)}
                      className="w-full bg-slate-950 border border-white/10 rounded px-2 py-1.5 text-white"
                    >
                      <option value="Tintura Rubio Claro 60ml">Tintura Rubio Claro 60ml</option>
                      <option value="Champú Profesional 1L">Champú Profesional 1L</option>
                      <option value="Cera Modeladora 100g">Cera Modeladora 100g</option>
                    </select>
                  </div>
                  <div className="col-span-3">
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(idx, "quantity", Number(e.target.value))}
                      className="w-full bg-slate-950 border border-white/10 rounded px-2 py-1.5 text-white text-center"
                    />
                  </div>
                  <div className="col-span-2 text-slate-400 text-[11px] font-mono">
                    {item.unitOfMeasure}
                  </div>
                  <div className="col-span-1 text-center">
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItemRow(idx)}
                        className="text-slate-500 hover:text-rose-400 font-bold"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full glass-btn-primary font-bold py-3 rounded-xl shadow-xl text-sm text-white transition mt-4"
          >
            ⚡ Emitir Remito y Actualizar Stock
          </button>
        </form>
      </Modal>

      {/* Modal Ver Detalle de Remito */}
      {selectedRemito && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
          <div className="w-full max-w-lg glass-panel rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Comprobante de Remito</h3>
                <p className="text-xs font-mono text-blue-400">{selectedRemito.noteNumber}</p>
              </div>
              <button
                onClick={() => setSelectedRemito(null)}
                className="text-slate-400 hover:text-white text-xl font-bold"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-950/80 rounded-xl p-4 text-xs space-y-2 font-mono border border-white/10">
              <p><strong className="text-slate-400">Tipo:</strong> {selectedRemito.type}</p>
              <p><strong className="text-slate-400">Receptor/Proveedor:</strong> {selectedRemito.recipientName}</p>
              <p><strong className="text-slate-400">Fecha de Emisión:</strong> {new Date(selectedRemito.createdAt).toLocaleString("es-AR")}</p>
              {selectedRemito.notes && <p><strong className="text-slate-400">Notas:</strong> {selectedRemito.notes}</p>}
            </div>

            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-300">Ítems Detallados:</span>
              <div className="bg-slate-900/90 rounded-xl p-3 border border-white/10 divide-y divide-white/5 text-xs">
                {selectedRemito.items.map((item, idx) => (
                  <div key={idx} className="py-2 flex justify-between items-center text-slate-200">
                    <span>{item.productName}</span>
                    <span className="font-mono font-bold text-emerald-400">{item.quantity} {item.unitOfMeasure}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => setSelectedRemito(null)}
              className="w-full glass-btn-secondary py-2.5 rounded-xl font-semibold text-xs text-white"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

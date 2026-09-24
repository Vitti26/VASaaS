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
      {/* Page Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Remitos & Guías de Despacho</h1>
          <p className="text-xs text-slate-500 mt-1">
            Gestión de ingresos de proveedores, salidas y traslados de mercadería entre sucursales con ajuste automático de stock.
          </p>
        </div>
        <button
          onClick={() => setIsNewModalOpen(true)}
          className="ventura-btn-primary flex items-center space-x-1.5 text-xs shadow-md"
        >
          <span>+ Emitir Nuevo Remito</span>
        </button>
      </div>

      {toastMessage && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-xs text-emerald-800 font-medium text-center shadow-sm">
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
          className="w-full sm:w-80 bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#c6f500]"
        />

        <div className="flex items-center space-x-2 text-xs text-slate-600 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <span className="text-slate-400 font-bold">Filtrar:</span>
          {["ALL", "ENTRY", "EXIT", "TRANSFER"].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${
                filterType === type
                  ? "bg-[#111216] text-[#c6f500] shadow"
                  : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200"
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

      {/* Remitos Table Card */}
      <div className="ventura-card overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">Historial de Comprobantes de Remito</h2>
          <span className="text-xs text-slate-400 font-medium">{filteredRemitos.length} registros</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-[#f8fafc] text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-100">
              <tr>
                <th className="px-6 py-3.5">N° Remito</th>
                <th className="px-6 py-3.5">Tipo Movimiento</th>
                <th className="px-6 py-3.5">Receptor / Proveedor</th>
                <th className="px-6 py-3.5">Ítems</th>
                <th className="px-6 py-3.5">Fecha</th>
                <th className="px-6 py-3.5">Estado</th>
                <th className="px-6 py-3.5 text-right">Detalle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-400">
                    Cargando remitos...
                  </td>
                </tr>
              ) : filteredRemitos.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-400">
                    No se encontraron remitos registrados.
                  </td>
                </tr>
              ) : (
                filteredRemitos.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-slate-900">{r.noteNumber}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                          r.type === "ENTRY"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : r.type === "EXIT"
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : "bg-blue-50 text-blue-700 border border-blue-200"
                        }`}
                      >
                        {r.type === "ENTRY" ? "⬇ Ingreso" : r.type === "EXIT" ? "⬆ Salida" : "🔄 Traslado"}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900">{r.recipientName}</td>
                    <td className="px-6 py-4 font-mono text-slate-700 font-semibold">
                      {r.items.reduce((acc, i) => acc + i.quantity, 0)} uds ({r.items.length} prod)
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-xs">
                      {new Date(r.createdAt).toLocaleDateString("es-AR")}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 text-emerald-700 text-xs font-bold">
                        ● Emitido
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setSelectedRemito(r)}
                        className="ventura-btn-secondary px-3 py-1.5 text-xs font-bold"
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
      </div>

      {/* Modal Nuevo Remito */}
      <Modal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        title="Emitir Nuevo Remito / Guía de Despacho"
      >
        <form onSubmit={handleCreateRemito} className="space-y-4 text-slate-800">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Tipo de Remito</label>
              <select
                value={formType}
                onChange={(e) => setFormType(e.target.value as DispatchNoteType)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-[#c6f500]"
              >
                <option value="ENTRY">Ingreso de Proveedor (Entrada)</option>
                <option value="EXIT">Salida a Cliente / Entrega (Salida)</option>
                <option value="TRANSFER">Traslado entre Sucursales (Transferencia)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {formType === "ENTRY" ? "Proveedor / Emisor" : formType === "EXIT" ? "Cliente / Receptor" : "Sucursal Destino"}
              </label>
              {formType === "TRANSFER" ? (
                <select
                  value={destinationBranch}
                  onChange={(e) => setDestinationBranch(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-[#c6f500]"
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
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-[#c6f500]"
                  required
                />
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Observaciones / Nota de Despacho</label>
            <input
              type="text"
              placeholder="Ej: Bultos precintados, transporte particular..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-[#c6f500]"
            />
          </div>

          {/* Dynamic Items Table */}
          <div className="space-y-2 border-t border-slate-100 pt-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">Detalle de Ítems e Insumos</span>
              <button
                type="button"
                onClick={handleAddItemRow}
                className="text-xs font-bold text-emerald-600 hover:underline"
              >
                + Agregar Ítem
              </button>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {items.map((item, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-slate-50 p-2 rounded-xl border border-slate-200 text-xs">
                  <div className="col-span-6">
                    <select
                      value={item.productName}
                      onChange={(e) => handleItemChange(idx, "productName", e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded px-2 py-1.5 text-slate-900"
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
                      className="w-full bg-white border border-slate-200 rounded px-2 py-1.5 text-slate-900 text-center"
                    />
                  </div>
                  <div className="col-span-2 text-slate-500 text-[11px] font-mono">
                    {item.unitOfMeasure}
                  </div>
                  <div className="col-span-1 text-center">
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItemRow(idx)}
                        className="text-slate-400 hover:text-rose-600 font-bold"
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
            className="w-full ventura-btn-primary font-bold py-3 rounded-xl shadow-md text-xs transition mt-4"
          >
            ⚡ Emitir Remito y Actualizar Stock
          </button>
        </form>
      </Modal>

      {/* Modal Ver Detalle de Remito */}
      {selectedRemito && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Comprobante de Remito</h3>
                <p className="text-xs font-mono text-slate-500">{selectedRemito.noteNumber}</p>
              </div>
              <button
                onClick={() => setSelectedRemito(null)}
                className="text-slate-400 hover:text-slate-700 text-xl font-bold"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 text-xs space-y-2 font-mono border border-slate-200 text-slate-800">
              <p><strong className="text-slate-500">Tipo:</strong> {selectedRemito.type}</p>
              <p><strong className="text-slate-500">Receptor/Proveedor:</strong> {selectedRemito.recipientName}</p>
              <p><strong className="text-slate-500">Fecha de Emisión:</strong> {new Date(selectedRemito.createdAt).toLocaleString("es-AR")}</p>
              {selectedRemito.notes && <p><strong className="text-slate-500">Notas:</strong> {selectedRemito.notes}</p>}
            </div>

            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-700">Ítems Detallados:</span>
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 divide-y divide-slate-100 text-xs">
                {selectedRemito.items.map((item, idx) => (
                  <div key={idx} className="py-2 flex justify-between items-center text-slate-800">
                    <span className="font-semibold">{item.productName}</span>
                    <span className="font-mono font-bold text-emerald-700">{item.quantity} {item.unitOfMeasure}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => setSelectedRemito(null)}
              className="w-full ventura-btn-dark py-2.5 rounded-xl font-semibold text-xs"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

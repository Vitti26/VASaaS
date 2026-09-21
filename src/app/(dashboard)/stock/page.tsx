"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";

interface StockItem {
  id: string;
  name: string;
  sku: string;
  unit: string;
  quantity: number;
  minStockAlert: number;
  isServiceInput: boolean;
  price: number;
}

export default function StockPage() {
  const [stockItems, setStockItems] = useState<StockItem[]>([
    {
      id: "1",
      name: "Champú Profesional 1L",
      sku: "CHA-1000",
      unit: "UNIT",
      quantity: 12,
      minStockAlert: 5,
      isServiceInput: false,
      price: 4500,
    },
    {
      id: "2",
      name: "Tintura Rubio Claro (Tubo 60ml)",
      sku: "TIN-800",
      unit: "UNIT",
      quantity: 3,
      minStockAlert: 5,
      isServiceInput: true,
      price: 2800,
    },
  ]);

  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);

  const [productForm, setProductForm] = useState({
    name: "",
    sku: "",
    unit: "UNIT",
    price: 0,
    cost: 0,
    minStockAlert: 5,
    isServiceInput: false,
  });

  const [movementForm, setMovementForm] = useState({
    productId: "1",
    type: "IN",
    quantity: 1,
    reason: "Compra a proveedor",
  });

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const newItem: StockItem = {
      id: Date.now().toString(),
      name: productForm.name,
      sku: productForm.sku || "N/A",
      unit: productForm.unit,
      quantity: 0,
      minStockAlert: productForm.minStockAlert,
      isServiceInput: productForm.isServiceInput,
      price: productForm.price,
    };
    setStockItems((prev) => [...prev, newItem]);
    setIsProductModalOpen(false);
    setProductForm({ name: "", sku: "", unit: "UNIT", price: 0, cost: 0, minStockAlert: 5, isServiceInput: false });
  };

  const handleRegisterMovement = (e: React.FormEvent) => {
    e.preventDefault();
    setStockItems((prev) =>
      prev.map((item) => {
        if (item.id === movementForm.productId) {
          const qty = Number(movementForm.quantity);
          let newQty = item.quantity;
          if (movementForm.type === "IN") newQty += qty;
          else if (movementForm.type === "OUT") newQty = Math.max(0, newQty - qty);
          else if (movementForm.type === "ADJUSTMENT") newQty = qty;
          return { ...item, quantity: newQty };
        }
        return item;
      })
    );
    setIsMovementModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Control de Stock e Insumos</h1>
          <p className="text-sm text-slate-400 mt-1">
            Inventario aislado por sucursal, productos para venta y recetas de consumo por servicio.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setIsMovementModalOpen(true)}
            className="glass-btn-secondary px-4 py-2.5 text-xs font-semibold rounded-xl text-slate-200"
          >
            ⚡ Registrar Movimiento
          </button>
          <button
            onClick={() => setIsProductModalOpen(true)}
            className="glass-btn-primary px-4 py-2.5 text-xs font-bold rounded-xl text-white shadow-lg"
          >
            + Nuevo Producto / Insumo
          </button>
        </div>
      </div>

      <div className="glass-table rounded-2xl overflow-hidden shadow-2xl">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-900/80 text-slate-300 uppercase text-xs tracking-wider border-b border-white/10">
            <tr>
              <th className="px-6 py-4">Producto / Insumo</th>
              <th className="px-6 py-4">SKU</th>
              <th className="px-6 py-4">Tipo</th>
              <th className="px-6 py-4">Stock Actual</th>
              <th className="px-6 py-4">Alerta Mínima</th>
              <th className="px-6 py-4">Precio Venta</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {stockItems.map((item) => {
              const isLowStock = item.quantity <= item.minStockAlert;
              return (
                <tr key={item.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 font-semibold text-white">
                    {item.name}
                    {isLowStock && (
                      <span className="ml-2.5 inline-flex items-center rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-400 border border-amber-500/20 shadow-sm backdrop-blur-md">
                        ⚠️ Stock Bajo
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-slate-400 font-mono text-xs">{item.sku}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-block px-3 py-1 text-xs font-semibold rounded-full backdrop-blur-md ${
                        item.isServiceInput
                          ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                          : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                      }`}
                    >
                      {item.isServiceInput ? "Insumo Servicio" : "Producto Reventa"}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold text-white">
                    {item.quantity} {item.unit}
                  </td>
                  <td className="px-6 py-4 text-slate-400">
                    {item.minStockAlert} {item.unit}
                  </td>
                  <td className="px-6 py-4 text-emerald-400 font-bold">
                    ${item.price.toLocaleString("es-AR")}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal Nuevo Producto */}
      <Modal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        title="Crear Nuevo Producto o Insumo de Servicio"
      >
        <form onSubmit={handleCreateProduct} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Nombre del Producto / Insumo</label>
            <input
              type="text"
              placeholder="Ej: Champú Nutritivo 1L"
              value={productForm.name}
              onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
              className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">SKU / Código</label>
              <input
                type="text"
                placeholder="CHA-001"
                value={productForm.sku}
                onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Unidad de Medida</label>
              <select
                value={productForm.unit}
                onChange={(e) => setProductForm({ ...productForm, unit: e.target.value })}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white"
              >
                <option value="UNIT">Unidad (UN)</option>
                <option value="KG">Kilogramos (KG)</option>
                <option value="LITER">Litros (L)</option>
                <option value="MILLILITER">Mililitros (ML)</option>
                <option value="GRAM">Gramos (GR)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Precio Venta ($)</label>
              <input
                type="number"
                min="0"
                value={productForm.price}
                onChange={(e) => setProductForm({ ...productForm, price: Number(e.target.value) })}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Alerta Stock Mínimo</label>
              <input
                type="number"
                min="0"
                value={productForm.minStockAlert}
                onChange={(e) => setProductForm({ ...productForm, minStockAlert: Number(e.target.value) })}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white"
                required
              />
            </div>
          </div>

          <div className="flex items-center space-x-2.5 bg-slate-800/30 p-3.5 rounded-xl border border-white/10">
            <input
              type="checkbox"
              id="isServiceInput"
              checked={productForm.isServiceInput}
              onChange={(e) => setProductForm({ ...productForm, isServiceInput: e.target.checked })}
              className="rounded border-slate-700 bg-slate-900 text-blue-600"
            />
            <label htmlFor="isServiceInput" className="text-xs text-slate-300 cursor-pointer font-medium">
              Es un **Insumo interno de Servicio** (se descuenta mediante recetas de turnos)
            </label>
          </div>

          <button
            type="submit"
            className="w-full glass-btn-primary font-bold py-3 rounded-xl text-sm shadow-xl text-white"
          >
            Guardar Producto en Base de Datos
          </button>
        </form>
      </Modal>

      {/* Modal Registrar Movimiento */}
      <Modal
        isOpen={isMovementModalOpen}
        onClose={() => setIsMovementModalOpen(false)}
        title="Registrar Movimiento de Stock"
      >
        <form onSubmit={handleRegisterMovement} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Producto</label>
            <select
              value={movementForm.productId}
              onChange={(e) => setMovementForm({ ...movementForm, productId: e.target.value })}
              className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white"
            >
              {stockItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} (Stock actual: {item.quantity})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Tipo de Movimiento</label>
              <select
                value={movementForm.type}
                onChange={(e) => setMovementForm({ ...movementForm, type: e.target.value })}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white"
              >
                <option value="IN">Ingreso (Compra / Recepción)</option>
                <option value="OUT">Baja (Merma / Rotura)</option>
                <option value="ADJUSTMENT">Ajuste Manual (Recuento)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Cantidad</label>
              <input
                type="number"
                min="1"
                value={movementForm.quantity}
                onChange={(e) => setMovementForm({ ...movementForm, quantity: Number(e.target.value) })}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Motivo / Observaciones</label>
            <input
              type="text"
              placeholder="Ej: Factura proveedor #1234"
              value={movementForm.reason}
              onChange={(e) => setMovementForm({ ...movementForm, reason: e.target.value })}
              className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white"
            />
          </div>

          <button
            type="submit"
            className="w-full glass-btn-primary font-bold py-3 rounded-xl text-sm shadow-xl text-white"
          >
            ⚡ Registrar Movimiento & Actualizar Stock
          </button>
        </form>
      </Modal>
    </div>
  );
}

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

  const totalProductos = stockItems.length;
  const stockDisponible = stockItems.reduce((acc, i) => acc + i.quantity, 0);
  const bajoStock = stockItems.filter((i) => i.quantity <= i.minStockAlert && i.quantity > 0).length;
  const sinStock = stockItems.filter((i) => i.quantity === 0).length;

  return (
    <div className="space-y-6">
      {/* Page Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Control de Stock e Insumos</h1>
          <p className="text-xs text-slate-500 mt-1">
            Inventario aislado por sucursal, productos para venta y recetas de consumo por servicio.
          </p>
        </div>
        <div className="flex gap-2.5">
          <button
            onClick={() => setIsMovementModalOpen(true)}
            className="ventura-btn-secondary text-xs"
          >
            ⚡ Registrar Movimiento
          </button>
          <button
            onClick={() => setIsProductModalOpen(true)}
            className="ventura-btn-primary text-xs shadow-md"
          >
            + Nuevo Producto / Insumo
          </button>
        </div>
      </div>

      {/* Ventura Style Stat Widgets Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="ventura-card p-5 space-y-3">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Productos</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold ventura-badge-lime">Catálogo</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-black text-slate-900">{totalProductos}</span>
            <span className="text-xs text-slate-400 font-medium">SKUs</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div className="bg-[#c6f500] h-1.5 rounded-full" style={{ width: "100%" }}></div>
          </div>
        </div>

        <div className="ventura-card p-5 space-y-3">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Stock Disponible</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold ventura-badge-green">Depósito OK</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-black text-slate-900">{stockDisponible}</span>
            <span className="text-xs text-slate-400 font-medium">Unidades</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: "75%" }}></div>
          </div>
        </div>

        <div className="ventura-card p-5 space-y-3">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Bajo Stock</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200">Alerta</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-black text-slate-900">{bajoStock}</span>
            <span className="text-xs text-slate-400 font-medium">A Reponer</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: "40%" }}></div>
          </div>
        </div>

        <div className="ventura-card p-5 space-y-3">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sin Stock</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold ventura-badge-red">Agotado</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-black text-slate-900">{sinStock}</span>
            <span className="text-xs text-slate-400 font-medium">Faltante</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div className="bg-rose-500 h-1.5 rounded-full" style={{ width: sinStock > 0 ? "100%" : "0%" }}></div>
          </div>
        </div>
      </div>

      {/* Stock Items Table Card */}
      <div className="ventura-card overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">Listado de Existencias de Stock</h2>
          <span className="text-xs text-slate-400 font-medium">{stockItems.length} registrados</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-[#f8fafc] text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-100">
              <tr>
                <th className="px-6 py-3.5">Producto / Insumo</th>
                <th className="px-6 py-3.5">SKU</th>
                <th className="px-6 py-3.5">Tipo</th>
                <th className="px-6 py-3.5">Stock Actual</th>
                <th className="px-6 py-3.5">Alerta Mínima</th>
                <th className="px-6 py-3.5">Precio Venta</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {stockItems.map((item) => {
                const isLowStock = item.quantity <= item.minStockAlert;
                return (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900">
                      {item.name}
                      {isLowStock && (
                        <span className="ml-2.5 inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200">
                          ⚠️ Stock Bajo
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-500 font-mono text-xs">{item.sku}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-block px-2.5 py-1 text-[11px] font-bold rounded-full ${
                          item.isServiceInput
                            ? "bg-purple-50 text-purple-700 border border-purple-200"
                            : "bg-blue-50 text-blue-700 border border-blue-200"
                        }`}
                      >
                        {item.isServiceInput ? "Insumo Servicio" : "Producto Reventa"}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900">
                      {item.quantity} {item.unit}
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {item.minStockAlert} {item.unit}
                    </td>
                    <td className="px-6 py-4 text-slate-900 font-bold">
                      ${item.price.toLocaleString("es-AR")}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Nuevo Producto */}
      <Modal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        title="Crear Nuevo Producto o Insumo de Servicio"
      >
        <form onSubmit={handleCreateProduct} className="space-y-4 text-slate-800">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Nombre del Producto / Insumo</label>
            <input
              type="text"
              placeholder="Ej: Champú Nutritivo 1L"
              value={productForm.name}
              onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:ring-[#c6f500]"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">SKU / Código</label>
              <input
                type="text"
                placeholder="CHA-001"
                value={productForm.sku}
                onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:ring-[#c6f500]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Unidad de Medida</label>
              <select
                value={productForm.unit}
                onChange={(e) => setProductForm({ ...productForm, unit: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:ring-[#c6f500]"
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
              <label className="block text-xs font-bold text-slate-700 mb-1">Precio Venta ($)</label>
              <input
                type="number"
                min="0"
                value={productForm.price}
                onChange={(e) => setProductForm({ ...productForm, price: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:ring-[#c6f500]"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Alerta Stock Mínimo</label>
              <input
                type="number"
                min="0"
                value={productForm.minStockAlert}
                onChange={(e) => setProductForm({ ...productForm, minStockAlert: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:ring-[#c6f500]"
                required
              />
            </div>
          </div>

          <div className="flex items-center space-x-2.5 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <input
              type="checkbox"
              id="isServiceInput"
              checked={productForm.isServiceInput}
              onChange={(e) => setProductForm({ ...productForm, isServiceInput: e.target.checked })}
              className="rounded border-slate-300 text-slate-900 focus:ring-[#c6f500]"
            />
            <label htmlFor="isServiceInput" className="text-xs text-slate-700 cursor-pointer font-bold">
              Es un Insumo interno de Servicio (se descuenta mediante recetas de turnos)
            </label>
          </div>

          <button
            type="submit"
            className="w-full ventura-btn-primary font-bold py-3 rounded-xl text-xs shadow-md"
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
        <form onSubmit={handleRegisterMovement} className="space-y-4 text-slate-800">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Producto</label>
            <select
              value={movementForm.productId}
              onChange={(e) => setMovementForm({ ...movementForm, productId: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:ring-[#c6f500]"
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
              <label className="block text-xs font-bold text-slate-700 mb-1">Tipo de Movimiento</label>
              <select
                value={movementForm.type}
                onChange={(e) => setMovementForm({ ...movementForm, type: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:ring-[#c6f500]"
              >
                <option value="IN">Ingreso (Compra / Recepción)</option>
                <option value="OUT">Baja (Merma / Rotura)</option>
                <option value="ADJUSTMENT">Ajuste Manual (Recuento)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Cantidad</label>
              <input
                type="number"
                min="1"
                value={movementForm.quantity}
                onChange={(e) => setMovementForm({ ...movementForm, quantity: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:ring-[#c6f500]"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Motivo / Observaciones</label>
            <input
              type="text"
              placeholder="Ej: Factura proveedor #1234"
              value={movementForm.reason}
              onChange={(e) => setMovementForm({ ...movementForm, reason: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:ring-[#c6f500]"
            />
          </div>

          <button
            type="submit"
            className="w-full ventura-btn-primary font-bold py-3 rounded-xl text-xs shadow-md"
          >
            ⚡ Registrar Movimiento & Actualizar Stock
          </button>
        </form>
      </Modal>
    </div>
  );
}

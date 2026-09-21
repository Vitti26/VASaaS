"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";

interface ServiceItem {
  id: string;
  name: string;
  description: string;
  durationMinutes: number;
  price: number;
  recipeCount: number;
}

export default function ServicesPage() {
  const [services, setServices] = useState<ServiceItem[]>([
    {
      id: "1",
      name: "Corte de Cabello + Peinado",
      description: "Servicio estándar de peluquería",
      durationMinutes: 45,
      price: 9500,
      recipeCount: 0,
    },
    {
      id: "2",
      name: "Coloración + Lavado",
      description: "Servicio técnico con consumo de tintura",
      durationMinutes: 90,
      price: 18000,
      recipeCount: 2,
    },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [serviceForm, setServiceForm] = useState({
    name: "",
    description: "",
    durationMinutes: 30,
    price: 0,
    hasRecipe: false,
    recipeProduct: "Tintura Rubio Claro 60ml",
    recipeQty: 1,
  });

  const handleCreateService = (e: React.FormEvent) => {
    e.preventDefault();
    const newService: ServiceItem = {
      id: Date.now().toString(),
      name: serviceForm.name,
      description: serviceForm.description || "-",
      durationMinutes: Number(serviceForm.durationMinutes),
      price: Number(serviceForm.price),
      recipeCount: serviceForm.hasRecipe ? 1 : 0,
    };
    setServices((prev) => [...prev, newService]);
    setIsModalOpen(false);
    setServiceForm({ name: "", description: "", durationMinutes: 30, price: 0, hasRecipe: false, recipeProduct: "Tintura Rubio Claro 60ml", recipeQty: 1 });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Servicios & Recetas de Insumos</h1>
          <p className="text-sm text-slate-400 mt-1">
            Catálogo de servicios ofrecidos y recetas de insumos a descontar automáticamente al facturar.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm rounded-lg shadow transition"
        >
          + Nuevo Servicio con Receta
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {services.map((s) => (
          <div
            key={s.id}
            className="rounded-xl bg-slate-900 border border-slate-800 p-5 flex flex-col justify-between hover:border-slate-700 transition"
          >
            <div>
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg text-white">{s.name}</h3>
                <span className="text-lg font-bold text-emerald-400">
                  ${s.price.toLocaleString("es-AR")}
                </span>
              </div>
              <p className="text-sm text-slate-400 mt-2">{s.description}</p>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span>⏱ Duración: {s.durationMinutes} min</span>
              <span className="inline-flex items-center gap-1 text-blue-400 font-medium">
                🧪 Insumos en receta: {s.recipeCount}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Nuevo Servicio */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Crear Nuevo Servicio y Receta de Insumos"
      >
        <form onSubmit={handleCreateService} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Nombre del Servicio</label>
            <input
              type="text"
              placeholder="Ej: Alisado Keratina + Peinado"
              value={serviceForm.name}
              onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Descripción</label>
            <input
              type="text"
              placeholder="Descripción del servicio..."
              value={serviceForm.description}
              onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Duración (minutos)</label>
              <input
                type="number"
                min="5"
                value={serviceForm.durationMinutes}
                onChange={(e) => setServiceForm({ ...serviceForm, durationMinutes: Number(e.target.value) })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Precio ($)</label>
              <input
                type="number"
                min="0"
                value={serviceForm.price}
                onChange={(e) => setServiceForm({ ...serviceForm, price: Number(e.target.value) })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                required
              />
            </div>
          </div>

          <div className="flex items-center space-x-2 bg-slate-800/50 p-3 rounded-lg border border-slate-700/60">
            <input
              type="checkbox"
              id="hasRecipe"
              checked={serviceForm.hasRecipe}
              onChange={(e) => setServiceForm({ ...serviceForm, hasRecipe: e.target.checked })}
              className="rounded border-slate-700 bg-slate-900 text-blue-600"
            />
            <label htmlFor="hasRecipe" className="text-xs text-slate-300 cursor-pointer">
              Vincular **Receta de Consumo de Insumo** del stock
            </label>
          </div>

          {serviceForm.hasRecipe && (
            <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700 space-y-3">
              <span className="text-xs font-semibold text-blue-400">Insumo a descontar por cada turno:</span>
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <select
                    value={serviceForm.recipeProduct}
                    onChange={(e) => setServiceForm({ ...serviceForm, recipeProduct: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-white"
                  >
                    <option value="Tintura Rubio Claro 60ml">Tintura Rubio Claro 60ml</option>
                    <option value="Champú Profesional 1L">Champú Profesional 1L</option>
                  </select>
                </div>
                <div>
                  <input
                    type="number"
                    min="1"
                    value={serviceForm.recipeQty}
                    onChange={(e) => setServiceForm({ ...serviceForm, recipeQty: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-white"
                    placeholder="Cant"
                  />
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-lg shadow transition"
          >
            Guardar Servicio & Receta en Base de Datos
          </button>
        </form>
      </Modal>
    </div>
  );
}

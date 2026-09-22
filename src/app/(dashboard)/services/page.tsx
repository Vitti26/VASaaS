"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";

interface ServiceItem {
  id: string;
  name: string;
  description: string;
  durationMinutes: number;
  price: number;
  recipeCount: number;
}

const DEFAULT_SERVICES: ServiceItem[] = [
  {
    id: "1",
    name: "Corte de Cabello + Peinado",
    description: "Servicio estándar de peluquería y estilización",
    durationMinutes: 45,
    price: 9500,
    recipeCount: 0,
  },
  {
    id: "2",
    name: "Coloración + Lavado",
    description: "Servicio técnico con consumo de tintura profesional",
    durationMinutes: 90,
    price: 18000,
    recipeCount: 2,
  },
  {
    id: "3",
    name: "Servicio de Barba Express",
    description: "Perfilado y perfilación de barba con toalla caliente",
    durationMinutes: 20,
    price: 4500,
    recipeCount: 1,
  },
];

const LOCAL_STORAGE_KEY = "vasaas_services_catalog_v1";

export default function ServicesPage() {
  const [services, setServices] = useState<ServiceItem[]>(DEFAULT_SERVICES);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [serviceForm, setServiceForm] = useState({
    name: "",
    description: "",
    durationMinutes: 30,
    price: 0,
    hasRecipe: false,
    recipeProduct: "Tintura Rubio Claro 60ml",
    recipeQty: 1,
  });

  // Load services from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        setServices(JSON.parse(saved));
      }
    } catch (e) {
      console.warn("Error al cargar catálogo de servicios:", e);
    }
  }, []);

  // Save services to localStorage on state change
  const saveServices = (newServices: ServiceItem[]) => {
    setServices(newServices);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newServices));
    } catch (e) {
      console.warn("Error al guardar servicio:", e);
    }
  };

  const handleCreateService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceForm.name.trim()) return;

    const newService: ServiceItem = {
      id: "srv-" + Date.now(),
      name: serviceForm.name.trim(),
      description: serviceForm.description.trim() || "Servicio registrado",
      durationMinutes: Number(serviceForm.durationMinutes) || 30,
      price: Number(serviceForm.price) || 0,
      recipeCount: serviceForm.hasRecipe ? 1 : 0,
    };

    const updated = [newService, ...services];
    saveServices(updated);

    setIsModalOpen(false);
    setServiceForm({
      name: "",
      description: "",
      durationMinutes: 30,
      price: 0,
      hasRecipe: false,
      recipeProduct: "Tintura Rubio Claro 60ml",
      recipeQty: 1,
    });

    setToastMessage(`¡Servicio "${newService.name}" guardado correctamente!`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleDeleteService = (id: string, name: string) => {
    if (confirm(`¿Desea eliminar el servicio "${name}"?`)) {
      const updated = services.filter((s) => s.id !== id);
      saveServices(updated);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Servicios</h1>
          <p className="text-xs text-slate-400 mt-1">
            Catálogo general de servicios ofrecidos y recetas de insumos vinculadas.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="glass-btn-primary px-4 py-2.5 rounded-xl font-bold text-xs text-white shadow-lg transition flex items-center justify-center space-x-1.5"
        >
          <span>+ Nuevo Servicio</span>
        </button>
      </div>

      {/* Toast Alert */}
      {toastMessage && (
        <div className="bg-emerald-500/20 border border-emerald-500/40 rounded-xl p-3.5 text-xs text-emerald-300 font-medium text-center backdrop-blur-md animate-fade-in">
          ✓ {toastMessage}
        </div>
      )}

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map((s) => (
          <div
            key={s.id}
            className="glass-card rounded-2xl p-5 flex flex-col justify-between space-y-4 hover:border-white/20 transition"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-bold text-base text-white">{s.name}</h3>
                <span className="text-base font-extrabold text-emerald-400 whitespace-nowrap">
                  ${s.price.toLocaleString("es-AR")}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-2 line-clamp-2">{s.description}</p>
            </div>
            <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
              <span>⏱ {s.durationMinutes} min</span>
              <div className="flex items-center space-x-3">
                <span className="text-blue-400 font-medium text-[11px]">
                  🧪 Receta: {s.recipeCount > 0 ? `${s.recipeCount} insumos` : "Sin insumos"}
                </span>
                <button
                  onClick={() => handleDeleteService(s.id, s.name)}
                  className="text-slate-500 hover:text-rose-400 text-xs font-bold transition"
                  title="Eliminar servicio"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Nuevo Servicio */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Crear Nuevo Servicio"
      >
        <form onSubmit={handleCreateService} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Nombre del Servicio</label>
            <input
              type="text"
              placeholder="Ej: Corte de Cabello Masculino"
              value={serviceForm.name}
              onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
              className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Descripción</label>
            <input
              type="text"
              placeholder="Descripción breve..."
              value={serviceForm.description}
              onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
              className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
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
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Precio ($ ARS)</label>
              <input
                type="number"
                min="0"
                value={serviceForm.price}
                onChange={(e) => setServiceForm({ ...serviceForm, price: Number(e.target.value) })}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                required
              />
            </div>
          </div>

          <div className="flex items-center space-x-2.5 bg-slate-900/60 p-3 rounded-xl border border-white/10">
            <input
              type="checkbox"
              id="hasRecipe"
              checked={serviceForm.hasRecipe}
              onChange={(e) => setServiceForm({ ...serviceForm, hasRecipe: e.target.checked })}
              className="rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="hasRecipe" className="text-xs text-slate-300 cursor-pointer font-medium">
              Vincular Receta de Consumo de Insumo del Stock
            </label>
          </div>

          {serviceForm.hasRecipe && (
            <div className="bg-slate-900/90 p-3.5 rounded-xl border border-white/10 space-y-3">
              <span className="text-xs font-semibold text-blue-400">Insumo a descontar por turno:</span>
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <select
                    value={serviceForm.recipeProduct}
                    onChange={(e) => setServiceForm({ ...serviceForm, recipeProduct: e.target.value })}
                    className="w-full bg-slate-950 border border-white/10 rounded-lg px-2.5 py-2 text-xs text-white"
                  >
                    <option value="Tintura Rubio Claro 60ml">Tintura Rubio Claro 60ml</option>
                    <option value="Champú Profesional 1L">Champú Profesional 1L</option>
                    <option value="Cera Modeladora 100g">Cera Modeladora 100g</option>
                  </select>
                </div>
                <div>
                  <input
                    type="number"
                    min="1"
                    value={serviceForm.recipeQty}
                    onChange={(e) => setServiceForm({ ...serviceForm, recipeQty: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-white/10 rounded-lg px-2.5 py-2 text-xs text-white"
                    placeholder="Cant"
                  />
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            className="w-full glass-btn-primary font-bold py-3 rounded-xl shadow-xl text-sm text-white transition"
          >
            ⚡ Guardar Servicio
          </button>
        </form>
      </Modal>
    </div>
  );
}

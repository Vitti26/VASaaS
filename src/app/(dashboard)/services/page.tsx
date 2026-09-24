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
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Catálogo de Servicios</h1>
          <p className="text-xs text-slate-500 mt-1">
            Gestión de servicios disponibles para turnos y recetas de insumos vinculadas.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="ventura-btn-primary flex items-center space-x-1.5 text-xs shadow-md"
        >
          <span>+ Nuevo Servicio</span>
        </button>
      </div>

      {toastMessage && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-xs text-emerald-800 font-medium text-center shadow-sm">
          ✓ {toastMessage}
        </div>
      )}

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map((s) => (
          <div
            key={s.id}
            className="ventura-card p-6 flex flex-col justify-between space-y-4 hover:border-slate-300 transition"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-bold text-base text-slate-900">{s.name}</h3>
                <span className="text-base font-black text-slate-900 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                  ${s.price.toLocaleString("es-AR")}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-2 line-clamp-2">{s.description}</p>
            </div>
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span className="font-semibold text-slate-700">⏱ {s.durationMinutes} min</span>
              <div className="flex items-center space-x-3">
                <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
                  🧪 {s.recipeCount > 0 ? `${s.recipeCount} insumos` : "Sin insumos"}
                </span>
                <button
                  onClick={() => handleDeleteService(s.id, s.name)}
                  className="text-slate-400 hover:text-rose-600 text-xs font-bold transition"
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
        <form onSubmit={handleCreateService} className="space-y-4 text-slate-800">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Nombre del Servicio</label>
            <input
              type="text"
              placeholder="Ej: Corte de Cabello Masculino"
              value={serviceForm.name}
              onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#c6f500]"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Descripción</label>
            <input
              type="text"
              placeholder="Descripción breve..."
              value={serviceForm.description}
              onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#c6f500]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Duración (minutos)</label>
              <input
                type="number"
                min="5"
                value={serviceForm.durationMinutes}
                onChange={(e) => setServiceForm({ ...serviceForm, durationMinutes: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#c6f500]"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Precio ($ ARS)</label>
              <input
                type="number"
                min="0"
                value={serviceForm.price}
                onChange={(e) => setServiceForm({ ...serviceForm, price: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#c6f500]"
                required
              />
            </div>
          </div>

          <div className="flex items-center space-x-2.5 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <input
              type="checkbox"
              id="hasRecipe"
              checked={serviceForm.hasRecipe}
              onChange={(e) => setServiceForm({ ...serviceForm, hasRecipe: e.target.checked })}
              className="rounded border-slate-300 text-slate-900 focus:ring-[#c6f500]"
            />
            <label htmlFor="hasRecipe" className="text-xs text-slate-700 cursor-pointer font-bold">
              Vincular Receta de Consumo de Insumo del Stock
            </label>
          </div>

          {serviceForm.hasRecipe && (
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
              <span className="text-xs font-bold text-slate-700">Insumo a descontar por turno:</span>
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <select
                    value={serviceForm.recipeProduct}
                    onChange={(e) => setServiceForm({ ...serviceForm, recipeProduct: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-2 text-xs text-slate-900"
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
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-2 text-xs text-slate-900"
                    placeholder="Cant"
                  />
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            className="w-full ventura-btn-primary font-bold py-3 rounded-xl text-xs shadow-md transition"
          >
            ⚡ Guardar Servicio
          </button>
        </form>
      </Modal>
    </div>
  );
}

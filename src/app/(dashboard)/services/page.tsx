"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Modal } from "@/components/ui/modal";
import { getServicesAction, createServiceAction } from "@/modules/services/actions";

interface ServiceItem {
  id: string;
  name: string;
  description: string;
  durationMinutes: number;
  price: number;
  recipeCount: number;
}

export default function ServicesPage() {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [serviceForm, setServiceForm] = useState({
    name: "",
    description: "",
    durationMinutes: 30,
    price: 0,
  });

  const loadServices = useCallback(async () => {
    try {
      const data = await getServicesAction();
      setServices(data as ServiceItem[]);
    } catch (error) {
      console.error("Error al cargar servicios:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadServices();
  }, [loadServices]);

  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceForm.name.trim()) return;

    setIsSubmitting(true);
    try {
      await createServiceAction({
        name: serviceForm.name.trim(),
        description: serviceForm.description.trim() || undefined,
        durationMinutes: Number(serviceForm.durationMinutes) || 30,
        price: Number(serviceForm.price) || 0,
        recipes: [],
      });

      await loadServices();

      setIsModalOpen(false);
      setServiceForm({
        name: "",
        description: "",
        durationMinutes: 30,
        price: 0,
      });

      setToastMessage(`¡Servicio "${serviceForm.name.trim()}" guardado correctamente!`);
      setTimeout(() => setToastMessage(null), 4000);
    } catch (error: any) {
      alert(error.message || "Error al crear servicio");
    } finally {
      setIsSubmitting(false);
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
        <div className="flex gap-2">
          <button
            onClick={() => loadServices()}
            className="ventura-btn-secondary text-xs"
          >
            🔄 Actualizar
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="ventura-btn-primary flex items-center space-x-1.5 text-xs shadow-md"
          >
            <span>+ Nuevo Servicio</span>
          </button>
        </div>
      </div>

      {toastMessage && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-xs text-emerald-800 font-medium text-center shadow-sm">
          ✓ {toastMessage}
        </div>
      )}

      {/* Services Grid */}
      {isLoading ? (
        <div className="p-8 text-center text-slate-400 text-xs font-medium">
          Cargando catálogo de servicios...
        </div>
      ) : services.length === 0 ? (
        <div className="p-8 text-center text-slate-400 text-xs font-medium">
          No hay servicios registrados aún. ¡Agregá el primero con el botón &quot;+ Nuevo Servicio&quot;!
        </div>
      ) : (
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
                <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
                  🧪 {s.recipeCount > 0 ? `${s.recipeCount} insumos` : "Sin insumos"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

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

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full ventura-btn-primary font-bold py-3 rounded-xl text-xs shadow-md transition disabled:opacity-50"
          >
            {isSubmitting ? "Guardando..." : "⚡ Guardar Servicio"}
          </button>
        </form>
      </Modal>
    </div>
  );
}


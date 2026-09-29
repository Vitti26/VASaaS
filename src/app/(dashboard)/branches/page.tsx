"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Modal } from "@/components/ui/modal";
import { getBranchesAction, createBranchAction } from "@/modules/branches/actions";

interface BranchItem {
  id: string;
  name: string;
  city: string;
  phone: string;
  isActive: boolean;
}

export default function BranchesPage() {
  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [branchForm, setBranchForm] = useState({
    name: "",
    city: "Buenos Aires",
    address: "",
    phone: "",
  });

  const loadBranches = useCallback(async () => {
    try {
      const data = await getBranchesAction();
      setBranches(data as BranchItem[]);
    } catch (error) {
      console.error("Error al cargar sucursales:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBranches();
  }, [loadBranches]);

  const handleCreateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!branchForm.name.trim()) {
      alert("Por favor ingrese el nombre de la sucursal.");
      return;
    }

    setIsSubmitting(true);
    try {
      await createBranchAction({
        name: branchForm.name.trim(),
        city: branchForm.city.trim() || undefined,
        address: branchForm.address.trim() || undefined,
        phone: branchForm.phone.trim() || undefined,
      });

      await loadBranches();
      setIsModalOpen(false);
      setBranchForm({ name: "", city: "Buenos Aires", address: "", phone: "" });
    } catch (error: any) {
      alert(error.message || "Error al crear sucursal");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Gestión de Sucursales</h1>
          <p className="text-xs text-slate-500 mt-1">
            Administrá las sedes activas de tu negocio. Plan STARTER: máximo 1 sucursal.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => loadBranches()}
            className="ventura-btn-secondary text-xs"
          >
            🔄 Actualizar
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="ventura-btn-primary text-xs shadow-md"
          >
            + Nueva Sucursal
          </button>
        </div>
      </div>

      {/* Branches Grid */}
      {isLoading ? (
        <div className="p-8 text-center text-slate-400 text-xs font-medium">
          Cargando sucursales...
        </div>
      ) : branches.length === 0 ? (
        <div className="p-8 text-center text-slate-400 text-xs font-medium">
          No hay sucursales registradas aún.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {branches.map((branch) => (
            <div
              key={branch.id}
              className="ventura-card p-6 space-y-4 hover:border-slate-300 transition"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-base text-slate-900">{branch.name}</h3>
                <span className="px-2.5 py-0.5 text-[11px] font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {branch.isActive ? "Activa" : "Inactiva"}
                </span>
              </div>
              <div className="text-xs text-slate-500 space-y-1 font-medium">
                <p>📍 Ciudad: {branch.city}</p>
                <p>📞 Teléfono: {branch.phone}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Nueva Sucursal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Crear Nueva Sucursal"
      >
        <form onSubmit={handleCreateBranch} className="space-y-4 text-slate-800">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Nombre de la Sucursal</label>
            <input
              type="text"
              placeholder="Ej: Sucursal Belgrano"
              value={branchForm.name}
              onChange={(e) => setBranchForm({ ...branchForm, name: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:ring-[#c6f500]"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Ciudad</label>
              <input
                type="text"
                value={branchForm.city}
                onChange={(e) => setBranchForm({ ...branchForm, city: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:ring-[#c6f500]"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Teléfono</label>
              <input
                type="text"
                placeholder="+54 11 ..."
                value={branchForm.phone}
                onChange={(e) => setBranchForm({ ...branchForm, phone: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:ring-[#c6f500]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Dirección</label>
            <input
              type="text"
              placeholder="Av. Cabildo 2100"
              value={branchForm.address}
              onChange={(e) => setBranchForm({ ...branchForm, address: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:ring-[#c6f500]"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full ventura-btn-primary font-bold py-3 rounded-xl text-xs shadow-md disabled:opacity-50"
          >
            {isSubmitting ? "Guardando..." : "Guardar Sucursal en PostgreSQL"}
          </button>
        </form>
      </Modal>
    </div>
  );
}


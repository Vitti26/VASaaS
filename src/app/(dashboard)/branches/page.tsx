"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";

interface BranchItem {
  id: string;
  name: string;
  city: string;
  phone: string;
  isActive: boolean;
}

export default function BranchesPage() {
  const [branches, setBranches] = useState<BranchItem[]>([
    {
      id: "1",
      name: "Sucursal Central Palermo",
      city: "Buenos Aires",
      phone: "+54 11 4444-5555",
      isActive: true,
    },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [branchForm, setBranchForm] = useState({
    name: "",
    city: "Buenos Aires",
    address: "",
    phone: "",
  });

  const handleCreateBranch = (e: React.FormEvent) => {
    e.preventDefault();
    const newBranch: BranchItem = {
      id: Date.now().toString(),
      name: branchForm.name,
      city: branchForm.city,
      phone: branchForm.phone || "-",
      isActive: true,
    };
    setBranches((prev) => [...prev, newBranch]);
    setIsModalOpen(false);
    setBranchForm({ name: "", city: "Buenos Aires", address: "", phone: "" });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Gestión de Sucursales</h1>
          <p className="text-sm text-slate-400 mt-1">
            Administrá las sedes activas de tu negocio. Plan STARTER: máximo 1 sucursal.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm rounded-lg shadow transition focus:outline-none focus:ring-2 focus:ring-blue-500/50"
        >
          + Nueva Sucursal
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {branches.map((branch) => (
          <div
            key={branch.id}
            className="rounded-xl bg-slate-900 border border-slate-800 p-5 space-y-4 hover:border-slate-700 transition"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg text-white">{branch.name}</h3>
              <span className="px-2 py-0.5 text-xs font-semibold rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Activa
              </span>
            </div>
            <div className="text-sm text-slate-400 space-y-1">
              <p>📍 Ciudad: {branch.city}</p>
              <p>📞 Teléfono: {branch.phone}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Nueva Sucursal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Crear Nueva Sucursal"
      >
        <form onSubmit={handleCreateBranch} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Nombre de la Sucursal</label>
            <input
              type="text"
              placeholder="Ej: Sucursal Belgrano"
              value={branchForm.name}
              onChange={(e) => setBranchForm({ ...branchForm, name: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Ciudad</label>
              <input
                type="text"
                value={branchForm.city}
                onChange={(e) => setBranchForm({ ...branchForm, city: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Teléfono</label>
              <input
                type="text"
                placeholder="+54 11 ..."
                value={branchForm.phone}
                onChange={(e) => setBranchForm({ ...branchForm, phone: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Dirección</label>
            <input
              type="text"
              placeholder="Av. Cabildo 2100"
              value={branchForm.address}
              onChange={(e) => setBranchForm({ ...branchForm, address: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-lg shadow transition"
          >
            Guardar Sucursal en PostgreSQL
          </button>
        </form>
      </Modal>
    </div>
  );
}

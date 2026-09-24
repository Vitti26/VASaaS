"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: "OWNER" | "ADMIN" | "STAFF";
  branchName: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserItem[]>([
    {
      id: "1",
      name: "Juan Propietario",
      email: "owner@negocio.com",
      role: "OWNER",
      branchName: "Todas las sucursales",
    },
    {
      id: "2",
      name: "María Barbera",
      email: "maria@negocio.com",
      role: "STAFF",
      branchName: "Sucursal Palermo",
    },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userForm, setUserForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "STAFF" as "OWNER" | "ADMIN" | "STAFF",
    branchName: "Sucursal Palermo",
  });

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    const newUser: UserItem = {
      id: Date.now().toString(),
      name: userForm.name,
      email: userForm.email,
      role: userForm.role,
      branchName: userForm.branchName,
    };
    setUsers((prev) => [...prev, newUser]);
    setIsModalOpen(false);
    setUserForm({ name: "", email: "", password: "", role: "STAFF", branchName: "Sucursal Palermo" });
  };

  return (
    <div className="space-y-6">
      {/* Page Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Usuarios & Permisos</h1>
          <p className="text-xs text-slate-500 mt-1">
            Gestión del personal (`OWNER`, `ADMIN`, `STAFF`) y asignación de sucursales.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="ventura-btn-primary text-xs shadow-md"
        >
          + Invitar Personal
        </button>
      </div>

      {/* Ventura Users Table Card */}
      <div className="ventura-card overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">Listado de Usuarios</h2>
          <span className="text-xs text-slate-400 font-medium">{users.length} miembros</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-[#f8fafc] text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-100">
              <tr>
                <th className="px-6 py-3.5">Nombre</th>
                <th className="px-6 py-3.5">Email</th>
                <th className="px-6 py-3.5">Rol</th>
                <th className="px-6 py-3.5">Sucursal Asignada</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-900">{u.name}</td>
                  <td className="px-6 py-4 font-medium text-slate-600">{u.email}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-block px-3 py-1 text-[11px] font-bold rounded-full ${
                        u.role === "OWNER"
                          ? "bg-purple-50 text-purple-700 border border-purple-200"
                          : u.role === "ADMIN"
                          ? "bg-blue-50 text-blue-700 border border-blue-200"
                          : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500 font-medium">{u.branchName}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Invitar Personal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Invitar Personal / Crear Usuario"
      >
        <form onSubmit={handleCreateUser} className="space-y-4 text-slate-800">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Nombre Completo</label>
            <input
              type="text"
              placeholder="Ej: Pedro Martínez"
              value={userForm.name}
              onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:ring-[#c6f500]"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Correo Electrónico</label>
              <input
                type="email"
                placeholder="pedro@negocio.com"
                value={userForm.email}
                onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:ring-[#c6f500]"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Contraseña Inicial</label>
              <input
                type="password"
                placeholder="******"
                value={userForm.password}
                onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:ring-[#c6f500]"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Rol de Usuario</label>
              <select
                value={userForm.role}
                onChange={(e) => setUserForm({ ...userForm, role: e.target.value as any })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:ring-[#c6f500]"
              >
                <option value="STAFF">STAFF (Personal atiende turnos)</option>
                <option value="ADMIN">ADMIN (Gestor de sucursal)</option>
                <option value="OWNER">OWNER (Propietario del Tenant)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Sucursal Asignada</label>
              <select
                value={userForm.branchName}
                onChange={(e) => setUserForm({ ...userForm, branchName: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:ring-[#c6f500]"
              >
                <option value="Sucursal Palermo">Sucursal Palermo</option>
                <option value="Sucursal Belgrano">Sucursal Belgrano</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="w-full ventura-btn-primary font-bold py-3 rounded-xl text-xs shadow-md"
          >
            Invitar Usuario & Encriptar Clave
          </button>
        </form>
      </Modal>
    </div>
  );
}

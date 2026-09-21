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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Usuarios & Permisos</h1>
          <p className="text-sm text-slate-400 mt-1">
            Gestión del personal (`OWNER`, `ADMIN`, `STAFF`) y asignación de sucursales.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm rounded-lg shadow transition"
        >
          + Invitar Personal
        </button>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-800/60 text-slate-200 uppercase text-xs tracking-wider">
            <tr>
              <th className="px-6 py-3">Nombre</th>
              <th className="px-6 py-3">Email</th>
              <th className="px-6 py-3">Rol</th>
              <th className="px-6 py-3">Sucursal Asignada</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-slate-800/40 transition">
                <td className="px-6 py-4 font-medium text-white">{u.name}</td>
                <td className="px-6 py-4">{u.email}</td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-block px-2.5 py-0.5 text-xs font-semibold rounded ${
                      u.role === "OWNER"
                        ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                        : u.role === "ADMIN"
                        ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                        : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    }`}
                  >
                    {u.role}
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-400">{u.branchName}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Invitar Personal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Invitar Personal / Crear Usuario"
      >
        <form onSubmit={handleCreateUser} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Nombre Completo</label>
            <input
              type="text"
              placeholder="Ej: Pedro Martínez"
              value={userForm.name}
              onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Correo Electrónico</label>
              <input
                type="email"
                placeholder="pedro@negocio.com"
                value={userForm.email}
                onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Contraseña Inicial</label>
              <input
                type="password"
                placeholder="******"
                value={userForm.password}
                onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Rol de Usuario</label>
              <select
                value={userForm.role}
                onChange={(e) => setUserForm({ ...userForm, role: e.target.value as any })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
              >
                <option value="STAFF">STAFF (Personal atiende turnos)</option>
                <option value="ADMIN">ADMIN (Gestor de sucursal)</option>
                <option value="OWNER">OWNER (Propietario del Tenant)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Sucursal Asignada</label>
              <select
                value={userForm.branchName}
                onChange={(e) => setUserForm({ ...userForm, branchName: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
              >
                <option value="Sucursal Palermo">Sucursal Palermo</option>
                <option value="Sucursal Belgrano">Sucursal Belgrano</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-lg shadow transition"
          >
            Invitar Usuario & Encriptar Clave
          </button>
        </form>
      </Modal>
    </div>
  );
}

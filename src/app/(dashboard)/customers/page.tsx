"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";

interface CustomerItem {
  id: string;
  name: string;
  phone: string;
  docType: string;
  docNumber: string;
  taxCategory: string;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerItem[]>([
    {
      id: "1",
      name: "Carlos Gómez",
      phone: "+54 11 9999-8888",
      docType: "DNI",
      docNumber: "35123456",
      taxCategory: "CONSUMIDOR_FINAL",
    },
    {
      id: "2",
      name: "Empresa Ejemplo S.A.",
      phone: "+54 11 4444-1111",
      docType: "CUIT",
      docNumber: "30-71123456-8",
      taxCategory: "RESPONSABLE_INSCRIPTO",
    },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customerForm, setCustomerForm] = useState({
    name: "",
    email: "",
    phone: "",
    docType: "DNI",
    docNumber: "",
    taxCategory: "CONSUMIDOR_FINAL",
  });

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    const newCust: CustomerItem = {
      id: Date.now().toString(),
      name: customerForm.name,
      phone: customerForm.phone || "-",
      docType: customerForm.docType,
      docNumber: customerForm.docNumber || "-",
      taxCategory: customerForm.taxCategory,
    };
    setCustomers((prev) => [...prev, newCust]);
    setIsModalOpen(false);
    setCustomerForm({ name: "", email: "", phone: "", docType: "DNI", docNumber: "", taxCategory: "CONSUMIDOR_FINAL" });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Directorio de Clientes</h1>
          <p className="text-sm text-slate-400 mt-1">
            Registro de clientes y datos fiscales obligatorios para la emisión de facturas AFIP.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm rounded-lg shadow transition"
        >
          + Nuevo Cliente
        </button>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-800/60 text-slate-200 uppercase text-xs tracking-wider">
            <tr>
              <th className="px-6 py-3">Nombre / Razón Social</th>
              <th className="px-6 py-3">Teléfono</th>
              <th className="px-6 py-3">Documento</th>
              <th className="px-6 py-3">Condición IVA</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {customers.map((c) => (
              <tr key={c.id} className="hover:bg-slate-800/40 transition">
                <td className="px-6 py-4 font-medium text-white">{c.name}</td>
                <td className="px-6 py-4">{c.phone}</td>
                <td className="px-6 py-4">
                  {c.docType}: {c.docNumber}
                </td>
                <td className="px-6 py-4">
                  <span className="inline-block px-2.5 py-0.5 text-xs font-medium rounded bg-slate-800 text-slate-300 border border-slate-700">
                    {c.taxCategory}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Nuevo Cliente */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Crear Nuevo Cliente"
      >
        <form onSubmit={handleCreateCustomer} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Nombre Completo / Razón Social</label>
            <input
              type="text"
              placeholder="Ej: Laura Rossi"
              value={customerForm.name}
              onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Teléfono</label>
              <input
                type="tel"
                placeholder="+54 11 ..."
                value={customerForm.phone}
                onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Correo Electrónico</label>
              <input
                type="email"
                placeholder="cliente@email.com"
                value={customerForm.email}
                onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Tipo de Documento</label>
              <select
                value={customerForm.docType}
                onChange={(e) => setCustomerForm({ ...customerForm, docType: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
              >
                <option value="DNI">DNI</option>
                <option value="CUIT">CUIT (11 dígitos)</option>
                <option value="PASAPORTE">Pasaporte</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Número de Documento</label>
              <input
                type="text"
                placeholder="35123456"
                value={customerForm.docNumber}
                onChange={(e) => setCustomerForm({ ...customerForm, docNumber: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Condición ante el IVA (AFIP)</label>
            <select
              value={customerForm.taxCategory}
              onChange={(e) => setCustomerForm({ ...customerForm, taxCategory: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
            >
              <option value="CONSUMIDOR_FINAL">Consumidor Final</option>
              <option value="RESPONSABLE_INSCRIPTO">Responsable Inscripto (Factura A)</option>
              <option value="MONOTRIBUTO">Monotributista</option>
              <option value="EXENTO">Exento</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-lg shadow transition"
          >
            Guardar Cliente en PostgreSQL
          </button>
        </form>
      </Modal>
    </div>
  );
}

"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Modal } from "@/components/ui/modal";
import { getCustomersAction, createCustomerAction } from "@/modules/customers/actions";

interface CustomerItem {
  id: string;
  name: string;
  phone: string;
  docType: string;
  docNumber: string;
  taxCategory: string;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customerForm, setCustomerForm] = useState({
    name: "",
    email: "",
    phone: "",
    docType: "DNI",
    docNumber: "",
    taxCategory: "CONSUMIDOR_FINAL",
  });

  const loadCustomers = useCallback(async () => {
    try {
      const data = await getCustomersAction();
      setCustomers(data as CustomerItem[]);
    } catch (error) {
      console.error("Error al cargar clientes:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerForm.name.trim() || !customerForm.docNumber.trim()) {
      alert("Por favor complete el nombre y número de documento.");
      return;
    }

    setIsSubmitting(true);
    try {
      await createCustomerAction({
        name: customerForm.name.trim(),
        email: customerForm.email.trim() || undefined,
        phone: customerForm.phone.trim() || undefined,
        docType: customerForm.docType as any,
        docNumber: customerForm.docNumber.trim(),
        taxCategory: customerForm.taxCategory as any,
      });

      await loadCustomers();
      setIsModalOpen(false);
      setCustomerForm({ name: "", email: "", phone: "", docType: "DNI", docNumber: "", taxCategory: "CONSUMIDOR_FINAL" });
    } catch (error: any) {
      alert(error.message || "Error al crear cliente");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Directorio de Clientes</h1>
          <p className="text-xs text-slate-500 mt-1">
            Registro de clientes y datos fiscales obligatorios para la emisión de facturas AFIP.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => loadCustomers()}
            className="ventura-btn-secondary text-xs"
          >
            🔄 Actualizar
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="ventura-btn-primary text-xs shadow-md"
          >
            + Nuevo Cliente
          </button>
        </div>
      </div>

      {/* Ventura Customers Table Card */}
      <div className="ventura-card overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">Listado de Clientes Registrados</h2>
          <span className="text-xs text-slate-400 font-medium">{customers.length} clientes</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-[#f8fafc] text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-100">
              <tr>
                <th className="px-6 py-3.5">Nombre / Razón Social</th>
                <th className="px-6 py-3.5">Teléfono</th>
                <th className="px-6 py-3.5">Documento</th>
                <th className="px-6 py-3.5">Condición IVA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-400 font-medium">
                    Cargando directorio de clientes...
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-400 font-medium">
                    No hay clientes registrados aún. ¡Agregá el primero con el botón &quot;+ Nuevo Cliente&quot;!
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900">{c.name}</td>
                    <td className="px-6 py-4 text-slate-600 font-medium">{c.phone}</td>
                    <td className="px-6 py-4 font-mono font-semibold text-slate-800">
                      {c.docType}: {c.docNumber}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-block px-3 py-1 text-[11px] font-bold rounded-full bg-slate-100 text-slate-800 border border-slate-200">
                        {c.taxCategory.replace("_", " ")}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Nuevo Cliente */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Crear Nuevo Cliente"
      >
        <form onSubmit={handleCreateCustomer} className="space-y-4 text-slate-800">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Nombre Completo / Razón Social</label>
            <input
              type="text"
              placeholder="Ej: Laura Rossi"
              value={customerForm.name}
              onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:ring-[#c6f500]"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Teléfono</label>
              <input
                type="tel"
                placeholder="+54 11 ..."
                value={customerForm.phone}
                onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:ring-[#c6f500]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Correo Electrónico</label>
              <input
                type="email"
                placeholder="cliente@email.com"
                value={customerForm.email}
                onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:ring-[#c6f500]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Tipo de Documento</label>
              <select
                value={customerForm.docType}
                onChange={(e) => setCustomerForm({ ...customerForm, docType: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:ring-[#c6f500]"
              >
                <option value="DNI">DNI</option>
                <option value="CUIT">CUIT (11 dígitos)</option>
                <option value="PASAPORTE">Pasaporte</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Número de Documento</label>
              <input
                type="text"
                placeholder="35123456"
                value={customerForm.docNumber}
                onChange={(e) => setCustomerForm({ ...customerForm, docNumber: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:ring-[#c6f500]"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Condición ante el IVA (AFIP)</label>
            <select
              value={customerForm.taxCategory}
              onChange={(e) => setCustomerForm({ ...customerForm, taxCategory: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:ring-[#c6f500]"
            >
              <option value="CONSUMIDOR_FINAL">Consumidor Final</option>
              <option value="RESPONSABLE_INSCRIPTO">Responsable Inscripto (Factura A)</option>
              <option value="MONOTRIBUTO">Monotributista</option>
              <option value="EXENTO">Exento</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full ventura-btn-primary font-bold py-3 rounded-xl text-xs shadow-md disabled:opacity-50"
          >
            {isSubmitting ? "Guardando Cliente..." : "Guardar Cliente en PostgreSQL"}
          </button>
        </form>
      </Modal>
    </div>
  );
}


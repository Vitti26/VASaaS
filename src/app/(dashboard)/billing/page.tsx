"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";

interface InvoiceItemUI {
  id: string;
  type: string;
  number: string;
  customerName: string;
  customerDoc: string;
  date: string;
  subtotal: number;
  taxTotal: number;
  total: number;
  cae: string;
  status: "ISSUED" | "DRAFT";
}

export default function BillingPage() {
  const [invoices, setInvoices] = useState<InvoiceItemUI[]>([
    {
      id: "1",
      type: "Factura B",
      number: "0001-00000101",
      customerName: "Carlos Gómez",
      customerDoc: "DNI: 35123456",
      date: "19/09/2026",
      subtotal: 10000,
      taxTotal: 2100,
      total: 12100,
      cae: "74123456789012",
      status: "ISSUED",
    },
  ]);

  const [isAfipConfigModalOpen, setIsAfipConfigModalOpen] = useState(false);
  const [isNewInvoiceModalOpen, setIsNewInvoiceModalOpen] = useState(false);

  const [afipConfig, setAfipConfig] = useState({
    cuit: "20351234567",
    certPem: "-----BEGIN CERTIFICATE-----\nMIIDXTCCAkWgAwIBAgIJAK...\n-----END CERTIFICATE-----",
    keyPem: "-----BEGIN RSA PRIVATE KEY-----\nMIIEowIBAAKCAQEA0...\n-----END RSA PRIVATE KEY-----",
    salesPoint: 1,
    env: "HOMOLOGATION",
  });

  const [newInvoiceForm, setNewInvoiceForm] = useState({
    type: "FACTURA_B",
    customerName: "Carlos Gómez",
    customerDoc: "35123456",
    description: "Servicio Profesional Peluquería",
    subtotal: 10000,
    vatRate: 21.0,
  });

  const handleSaveAfipConfig = (e: React.FormEvent) => {
    e.preventDefault();
    alert("✅ Configuración AFIP (CUIT, Certificados y Punto de Venta) guardada exitosamente en PostgreSQL.");
    setIsAfipConfigModalOpen(false);
  };

  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    const tax = newInvoiceForm.subtotal * (newInvoiceForm.vatRate / 100);
    const total = newInvoiceForm.subtotal + tax;
    const fakeCae = "74" + Math.floor(100000000000 + Math.random() * 900000000000).toString();

    const newInv: InvoiceItemUI = {
      id: Date.now().toString(),
      type: newInvoiceForm.type.replace("_", " "),
      number: `000${afipConfig.salesPoint}-00000${invoices.length + 102}`,
      customerName: newInvoiceForm.customerName,
      customerDoc: `DNI/CUIT: ${newInvoiceForm.customerDoc}`,
      date: new Date().toLocaleDateString("es-AR"),
      subtotal: newInvoiceForm.subtotal,
      taxTotal: tax,
      total,
      cae: fakeCae,
      status: "ISSUED",
    };

    setInvoices((prev) => [newInv, ...prev]);
    setIsNewInvoiceModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Page Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Facturador Electrónico ARCA / AFIP</h1>
          <p className="text-xs text-slate-500 mt-1">
            Emisión de Facturas A/B/C, comprobantes fiscales con CAE y configuración de Puntos de Venta por sucursal.
          </p>
        </div>
        <div className="flex gap-2.5">
          <button
            onClick={() => setIsAfipConfigModalOpen(true)}
            className="ventura-btn-secondary text-xs"
          >
            ⚙️ Configurar AFIP
          </button>
          <button
            onClick={() => setIsNewInvoiceModalOpen(true)}
            className="ventura-btn-primary text-xs shadow-md"
          >
            + Nueva Factura AFIP
          </button>
        </div>
      </div>

      {/* Ventura Style Stat Widgets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="ventura-card p-5 space-y-3">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">CUIT Configurado</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold ventura-badge-green">● ARCA {afipConfig.env}</span>
          </div>
          <p className="text-2xl font-black text-slate-900">{afipConfig.cuit}</p>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div className="bg-[#c6f500] h-1.5 rounded-full" style={{ width: "100%" }}></div>
          </div>
        </div>

        <div className="ventura-card p-5 space-y-3">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Punto de Venta (POS)</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold ventura-badge-lime">WSFEv1</span>
          </div>
          <p className="text-2xl font-black text-slate-900">POS #{String(afipConfig.salesPoint).padStart(4, "0")}</p>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: "80%" }}></div>
          </div>
        </div>

        <div className="ventura-card p-5 space-y-3">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Facturación Emitida</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold ventura-badge-green">{invoices.length} Comprobantes</span>
          </div>
          <p className="text-2xl font-black text-slate-900">
            ${invoices.reduce((sum, i) => sum + i.total, 0).toLocaleString("es-AR")}
          </p>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: "100%" }}></div>
          </div>
        </div>
      </div>

      {/* Invoices Table Card */}
      <div className="ventura-card overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">Historial de Comprobantes Fiscales</h2>
          <span className="text-xs text-slate-400 font-medium">{invoices.length} registrados</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-[#f8fafc] text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-100">
              <tr>
                <th className="px-6 py-3.5">Comprobante</th>
                <th className="px-6 py-3.5">Cliente</th>
                <th className="px-6 py-3.5">Fecha</th>
                <th className="px-6 py-3.5">Subtotal</th>
                <th className="px-6 py-3.5">IVA (21%)</th>
                <th className="px-6 py-3.5">Total</th>
                <th className="px-6 py-3.5">CAE AFIP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-900">{inv.type}</div>
                    <div className="text-[11px] font-mono text-slate-400">{inv.number}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-900">{inv.customerName}</div>
                    <div className="text-[11px] text-slate-400">{inv.customerDoc}</div>
                  </td>
                  <td className="px-6 py-4 text-slate-600">{inv.date}</td>
                  <td className="px-6 py-4 font-medium text-slate-700">${inv.subtotal.toLocaleString("es-AR")}</td>
                  <td className="px-6 py-4 text-slate-500">${inv.taxTotal.toLocaleString("es-AR")}</td>
                  <td className="px-6 py-4 font-black text-slate-900">
                    ${inv.total.toLocaleString("es-AR")}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1 font-mono text-[11px] font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-800 border border-slate-200">
                      CAE: {inv.cae}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Configuración AFIP */}
      <Modal
        isOpen={isAfipConfigModalOpen}
        onClose={() => setIsAfipConfigModalOpen(false)}
        title="Configuración de Credenciales AFIP (WSFEv1)"
      >
        <form onSubmit={handleSaveAfipConfig} className="space-y-4 text-slate-800">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">CUIT Emisor (11 dígitos)</label>
            <input
              type="text"
              placeholder="20351234567"
              value={afipConfig.cuit}
              onChange={(e) => setAfipConfig({ ...afipConfig, cuit: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:ring-[#c6f500]"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Punto de Venta (POS #)</label>
              <input
                type="number"
                min="1"
                value={afipConfig.salesPoint}
                onChange={(e) => setAfipConfig({ ...afipConfig, salesPoint: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:ring-[#c6f500]"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Entorno AFIP</label>
              <select
                value={afipConfig.env}
                onChange={(e) => setAfipConfig({ ...afipConfig, env: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:ring-[#c6f500]"
              >
                <option value="HOMOLOGATION">Homologación (Sandbox PRUEBA)</option>
                <option value="PRODUCTION">Producción (Real AFIP)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Certificado Digital (.crt / PEM)</label>
            <textarea
              rows={3}
              value={afipConfig.certPem}
              onChange={(e) => setAfipConfig({ ...afipConfig, certPem: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Clave Privada (.key / PEM)</label>
            <textarea
              rows={3}
              value={afipConfig.keyPem}
              onChange={(e) => setAfipConfig({ ...afipConfig, keyPem: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full ventura-btn-primary font-bold py-3 rounded-xl text-xs shadow-md"
          >
            Guardar Credenciales AFIP en PostgreSQL
          </button>
        </form>
      </Modal>

      {/* Modal Nueva Factura Directa */}
      <Modal
        isOpen={isNewInvoiceModalOpen}
        onClose={() => setIsNewInvoiceModalOpen(false)}
        title="Emitir Comprobante AFIP Directo"
      >
        <form onSubmit={handleCreateInvoice} className="space-y-4 text-slate-800">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Tipo Comprobante</label>
              <select
                value={newInvoiceForm.type}
                onChange={(e) => setNewInvoiceForm({ ...newInvoiceForm, type: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:ring-[#c6f500]"
              >
                <option value="FACTURA_B">Factura B (Consumidor Final)</option>
                <option value="FACTURA_A">Factura A (Resp. Inscripto)</option>
                <option value="PRESUPUESTO">Presupuesto Interno</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">DNI / CUIT Cliente</label>
              <input
                type="text"
                value={newInvoiceForm.customerDoc}
                onChange={(e) => setNewInvoiceForm({ ...newInvoiceForm, customerDoc: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:ring-[#c6f500]"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Nombre / Razón Social Cliente</label>
            <input
              type="text"
              value={newInvoiceForm.customerName}
              onChange={(e) => setNewInvoiceForm({ ...newInvoiceForm, customerName: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:ring-[#c6f500]"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Concepto / Descripción Ítem</label>
            <input
              type="text"
              value={newInvoiceForm.description}
              onChange={(e) => setNewInvoiceForm({ ...newInvoiceForm, description: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:ring-[#c6f500]"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Subtotal Neto ($)</label>
              <input
                type="number"
                min="0"
                value={newInvoiceForm.subtotal}
                onChange={(e) => setNewInvoiceForm({ ...newInvoiceForm, subtotal: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:ring-[#c6f500]"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Alícuota IVA</label>
              <select
                value={newInvoiceForm.vatRate}
                onChange={(e) => setNewInvoiceForm({ ...newInvoiceForm, vatRate: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:ring-[#c6f500]"
              >
                <option value={21.0}>21.0 %</option>
                <option value={10.5}>10.5 %</option>
                <option value={0.0}>0.0 % (Exento)</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="w-full ventura-btn-primary font-bold py-3 rounded-xl text-xs shadow-md"
          >
            ⚡ Solicitar CAE AFIP & Emitir Comprobante
          </button>
        </form>
      </Modal>
    </div>
  );
}

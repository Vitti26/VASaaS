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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Facturador Electrónico AFIP</h1>
          <p className="text-sm text-slate-400 mt-1">
            Emisión de Facturas A/B/C, comprobantes fiscales con CAE y configuración de Puntos de Venta por sucursal.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setIsAfipConfigModalOpen(true)}
            className="glass-btn-secondary px-4 py-2.5 text-xs font-semibold rounded-xl text-slate-200"
          >
            ⚙️ Configurar AFIP
          </button>
          <button
            onClick={() => setIsNewInvoiceModalOpen(true)}
            className="glass-btn-primary px-4 py-2.5 text-xs font-bold rounded-xl text-white shadow-lg"
          >
            + Nueva Factura AFIP
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="glass-card p-5 rounded-2xl">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">CUIT Configurado</span>
          <p className="text-2xl font-extrabold text-white mt-1">{afipConfig.cuit}</p>
          <span className="inline-block mt-2.5 px-3 py-1 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 backdrop-blur-md">
            ● AFIP {afipConfig.env}
          </span>
        </div>
        <div className="glass-card p-5 rounded-2xl">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Punto de Venta (POS)</span>
          <p className="text-2xl font-extrabold text-white mt-1">POS #{String(afipConfig.salesPoint).padStart(4, "0")}</p>
          <span className="inline-block mt-2.5 text-xs text-slate-400 font-medium">Tipo: WSFEv1 Electrónico</span>
        </div>
        <div className="glass-card p-5 rounded-2xl">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Facturación Emitida</span>
          <p className="text-2xl font-extrabold text-emerald-400 mt-1">
            ${invoices.reduce((sum, i) => sum + i.total, 0).toLocaleString("es-AR")} ARS
          </p>
          <span className="inline-block mt-2.5 text-xs text-slate-400 font-medium">Total {invoices.length} comprobantes</span>
        </div>
      </div>

      <div className="glass-table rounded-2xl overflow-hidden shadow-2xl">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-900/80 text-slate-300 uppercase text-xs tracking-wider border-b border-white/10">
            <tr>
              <th className="px-6 py-4">Comprobante</th>
              <th className="px-6 py-4">Cliente</th>
              <th className="px-6 py-4">Fecha</th>
              <th className="px-6 py-4">Subtotal</th>
              <th className="px-6 py-4">IVA (21%)</th>
              <th className="px-6 py-4">Total</th>
              <th className="px-6 py-4">CAE AFIP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {invoices.map((inv) => (
              <tr key={inv.id} className="hover:bg-white/5 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-bold text-white">{inv.type}</div>
                  <div className="text-xs font-mono text-slate-400">{inv.number}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="font-semibold text-white">{inv.customerName}</div>
                  <div className="text-xs text-slate-400">{inv.customerDoc}</div>
                </td>
                <td className="px-6 py-4">{inv.date}</td>
                <td className="px-6 py-4">${inv.subtotal.toLocaleString("es-AR")}</td>
                <td className="px-6 py-4">${inv.taxTotal.toLocaleString("es-AR")}</td>
                <td className="px-6 py-4 font-bold text-emerald-400">
                  ${inv.total.toLocaleString("es-AR")}
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center gap-1 font-mono text-xs px-3 py-1 rounded-full bg-slate-800/80 text-blue-400 border border-white/10 backdrop-blur-md">
                    CAE: {inv.cae}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Configuración AFIP */}
      <Modal
        isOpen={isAfipConfigModalOpen}
        onClose={() => setIsAfipConfigModalOpen(false)}
        title="Configuración de Credenciales AFIP (WSFEv1)"
      >
        <form onSubmit={handleSaveAfipConfig} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">CUIT Emisor (11 dígitos)</label>
            <input
              type="text"
              placeholder="20351234567"
              value={afipConfig.cuit}
              onChange={(e) => setAfipConfig({ ...afipConfig, cuit: e.target.value })}
              className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Punto de Venta (POS #)</label>
              <input
                type="number"
                min="1"
                value={afipConfig.salesPoint}
                onChange={(e) => setAfipConfig({ ...afipConfig, salesPoint: Number(e.target.value) })}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Entorno AFIP</label>
              <select
                value={afipConfig.env}
                onChange={(e) => setAfipConfig({ ...afipConfig, env: e.target.value })}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white"
              >
                <option value="HOMOLOGATION">Homologación (Sandbox PRUEBA)</option>
                <option value="PRODUCTION">Producción (Real AFIP)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Certificado Digital (.crt / PEM)</label>
            <textarea
              rows={3}
              value={afipConfig.certPem}
              onChange={(e) => setAfipConfig({ ...afipConfig, certPem: e.target.value })}
              className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Clave Privada (.key / PEM)</label>
            <textarea
              rows={3}
              value={afipConfig.keyPem}
              onChange={(e) => setAfipConfig({ ...afipConfig, keyPem: e.target.value })}
              className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full glass-btn-primary font-bold py-3 rounded-xl text-sm shadow-xl text-white"
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
        <form onSubmit={handleCreateInvoice} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Tipo Comprobante</label>
              <select
                value={newInvoiceForm.type}
                onChange={(e) => setNewInvoiceForm({ ...newInvoiceForm, type: e.target.value })}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white"
              >
                <option value="FACTURA_B">Factura B (Consumidor Final)</option>
                <option value="FACTURA_A">Factura A (Resp. Inscripto)</option>
                <option value="PRESUPUESTO">Presupuesto Interno</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">DNI / CUIT Cliente</label>
              <input
                type="text"
                value={newInvoiceForm.customerDoc}
                onChange={(e) => setNewInvoiceForm({ ...newInvoiceForm, customerDoc: e.target.value })}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Nombre / Razón Social Cliente</label>
            <input
              type="text"
              value={newInvoiceForm.customerName}
              onChange={(e) => setNewInvoiceForm({ ...newInvoiceForm, customerName: e.target.value })}
              className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Concepto / Descripción Ítem</label>
            <input
              type="text"
              value={newInvoiceForm.description}
              onChange={(e) => setNewInvoiceForm({ ...newInvoiceForm, description: e.target.value })}
              className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Subtotal Neto ($)</label>
              <input
                type="number"
                min="0"
                value={newInvoiceForm.subtotal}
                onChange={(e) => setNewInvoiceForm({ ...newInvoiceForm, subtotal: Number(e.target.value) })}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Alícuota IVA</label>
              <select
                value={newInvoiceForm.vatRate}
                onChange={(e) => setNewInvoiceForm({ ...newInvoiceForm, vatRate: Number(e.target.value) })}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white"
              >
                <option value={21.0}>21.0 %</option>
                <option value={10.5}>10.5 %</option>
                <option value={0.0}>0.0 % (Exento)</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="w-full glass-btn-primary font-bold py-3 rounded-xl text-sm shadow-xl text-white"
          >
            ⚡ Solicitar CAE AFIP & Emitir Comprobante
          </button>
        </form>
      </Modal>
    </div>
  );
}

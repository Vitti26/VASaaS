# Hoja de Ruta y Plan de Entregables (ROADMAP)

Este documento detalla las fases de desarrollo ordenadas de manera secuencial. Cada fase es autónoma, entregable y cuenta con su correspondiente plan de pruebas unitarias/integración en Vitest y comandos de verificación.

---

## Resumen de Fases

```mermaid
gantt
    title Plan de Desarrollo por Fases
    dateFormat  YYYY-MM-DD
    section Infraestructura & Auth
    Fase 1: Multi-Tenancy & Auth Core       :active, f1, 2026-10-01, 5d
    section Módulos Base
    Fase 2: Sucursales, Usuarios & Servicios :f2, after f1, 5d
    Fase 3: Stock e Insumos por Sucursal    :f3, after f2, 6d
    Fase 4: Agenda Interna & Link Público    :f4, after f3, 7d
    section Fiscal & SaaS
    Fase 5: Facturación Electrónica AFIP     :f5, after f4, 7d
    Fase 6: Flujo Integrado Semiautomático  :f6, after f5, 4d
    Fase 7: Suscripciones Mercado Pago SaaS  :f7, after f6, 5d
```

---

## Fase 1: Fundaciones, Database & Multi-Tenant Auth Core

### Alcance:
- Configuración de Next.js (App Router), Prisma ORM y PostgreSQL.
- Modelo de base de datos base (`Tenant`, `User`, `Subscription`).
- Resolver de contexto Multi-Tenant (`getTenantContext`) desde cookies/sesión de JWT.
- Middleware de autenticación y verificación de roles (`OWNER`, `ADMIN`, `STAFF`).
- Setup del entorno de pruebas con Vitest.

### Criterios de Aceptación & Verificación:
- [ ] No es posible acceder a datos de otro tenant alterando IDs en peticiones client-side.
- [ ] Las consultas Prisma filtran automáticamente mediante `where: { tenantId }`.
- [ ] **Tests con Vitest:**
  - Test unitario: Verificación del parser de token JWT y extracción segura de `tenantId`.
  - Test de integración: Aislamiento estricto de base de datos entre 2 tenants independientes.
- [ ] Comandos de verificación: `npm run test`, `npm run lint`, `tsc --noEmit`.

---

## Fase 2: Gestión Multi-Sucursal, Usuarios y Servicios

### Alcance:
- CRUD de Sucursales (`Branch`) por tenant (`OWNER`).
- Invitación y asignación de usuarios (`UserBranch`) con roles (`ADMIN`, `STAFF`).
- Registro de Clientes (`Customer`) con DNI/CUIT y Condición IVA.
- Configuración de catálogo de Servicios (`Service`) y definición de recetas de insumos (`ServiceRecipe`).

### Criterios de Aceptación & Verificación:
- [ ] El rol `STAFF` solo puede interactuar con las sucursales que tiene explícitamente asignadas.
- [ ] Creación de servicios indicando precio, duración e insumos consumidos.
- [ ] **Tests con Vitest:**
  - Test unitario: Validación de esquemas Zod para la creación de servicios y asignación de roles.
  - Test de servicio: Asignación de recetas de productos a un servicio.
- [ ] Comandos de verificación: `npm run test`, `npm run lint`, `tsc --noEmit`.

---

## Fase 3: Control de Stock e Insumos por Sucursal

### Alcance:
- Catálogo de Productos/Insumos (`Product`) por tenant.
- Control de inventario independiente por sucursal (`BranchStock`).
- Registro de movimientos de stock manuales (`IN`, `OUT`, `ADJUSTMENT`).
- Cálculo de alertas de stock mínimo por sucursal.

### Criterios de Aceptación & Verificación:
- [ ] El stock de la Sucursal A no se altera cuando se realiza un movimiento en la Sucursal B.
- [ ] Alerta visual cuando `quantity <= minStockAlert`.
- [ ] **Tests con Vitest:**
  - Test de lógica de negocio: Cálculo atómico de deltas de stock al registrar movimientos.
  - Test de validación: Prevención de stock negativo si está configurada la regla estricta.
- [ ] Comandos de verificación: `npm run test`, `npm run lint`, `tsc --noEmit`.

---

## Fase 4: Agenda de Turnos (Gestión Interna + Link Público)

### Alcance:
- Calendario interno para profesionales (`staff`) por sucursal.
- Gestión de estados de turno: `PENDING`, `CONFIRMED`, `COMPLETED`, `CANCELLED`, `NO_SHOW`.
- Validación de solapamiento de horarios por profesional y sucursal.
- Portal público de reservas (`/b/[tenant-slug]/[branch-slug]`) sin requerir login del cliente.

### Criterios de Aceptación & Verificación:
- [ ] Prevención estricta de doble reserva en el mismo rango de tiempo para un mismo profesional.
- [ ] La reserva desde la página pública crea el turno en estado `PENDING` y registra al cliente si no existía.
- [ ] **Tests con Vitest:**
  - Test de servicio: Algoritmo de detección de solapamiento de turnos.
  - Test de disponibilidad: Generación de slots disponibles según horario del staff.
- [ ] Comandos de verificación: `npm run test`, `npm run lint`, `tsc --noEmit`.

---

## Fase 5: Facturador Electrónico AFIP (WSFEv1 / WSAA)

### Alcance:
- Configuración de AFIP por tenant (`AfipConfig`): CUIT, certificado (.crt) y clave privada (.key).
- Cliente wrapper para conexión con WSAA (obtención de Ticket de Acceso TA) y WSFEv1.
- Generación de Facturas A, B, C y Notas de Crédito A, B, C.
- Asignación de Punto de Venta (POS) por sucursal.
- Integración en entorno Homologación (Sandbox) y Producción.

### Criterios de Aceptación & Verificación:
- [ ] Emisión exitosa de comprobantes A/B/C en el ambiente de prueba AFIP recibiendo CAE y vencimiento.
- [ ] Manejo estructurado de errores fiscal (CUIT inválido, inconsistencia de IVA, fallo de conexión AFIP).
- [ ] **Tests con Vitest:**
  - Test unitario: Cálculo de subtotal, alícuotas de IVA (21%, 10.5%) e importes totales.
  - Test mock: Simulación de respuesta de AFIP WSFE (CAE exitoso y rechazo fiscal).
- [ ] Comandos de verificación: `npm run test`, `npm run lint`, `tsc --noEmit`.

---

## Fase 6: Flujo Integrado Semiautomático (Turno -> Factura -> Stock)

### Alcance:
- Transición del turno a estado `COMPLETED` habilita la acción "Cobrar".
- Pantalla de cobro prellenada con los datos del turno y opción de agregar ítems de reventa.
- Ejecución atómica de la transacción:
  1. Emisión del comprobante fiscal (Factura/Recibo).
  2. Descuento automático del stock de la sucursal (insumos de la receta + productos vendidos).
  3. Registro del movimiento de stock con `referenceId` vinculado a la factura/turno.

### Criterios de Aceptación & Verificación:
- [ ] Si falla la emisión fiscal o la deducción de stock, la transacción se revierte en su totalidad (rollback).
- [ ] Descuento correcto de insumos según las cantidades definidas en la receta del servicio prestado.
- [ ] **Tests con Vitest:**
  - Test de integración e2e de servicio: Simulación completa de cierre de turno -> generación de comprobante -> verificación de deducción en `BranchStock`.
- [ ] Comandos de verificación: `npm run test`, `npm run lint`, `tsc --noEmit`.

---

## Fase 7: Modelo de Suscripciones SaaS (Mercado Pago API)

### Alcance:
- Conexión con Mercado Pago Preapproval / Subscriptions API.
- Lógica de Trial de 14 días al registrar un nuevo Tenant.
- Bloqueo/Restricción de funcionalidades Pro (ej: multi-sucursal o AFIP) en plan Starter.
- Manejo de Webhooks de Mercado Pago para actualización de estado de pago de suscripción (`ACTIVE`, `PAST_DUE`, `CANCELED`).

### Criterios de Aceptación & Verificación:
- [ ] Redirección o bloqueo de acceso al expirar el trial sin suscripción activa.
- [ ] Procesamiento idempotente de webhooks de Mercado Pago.
- [ ] **Tests con Vitest:**
  - Test unitario: Verificación de firma y validador de webhooks Mercado Pago.
  - Test de servicio: Evaluación de reglas de límites por plan (`STARTER` vs `PRO`).
- [ ] Comandos de verificación: `npm run test`, `npm run lint`, `tsc --noEmit`.

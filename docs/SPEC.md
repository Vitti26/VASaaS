# Especificación Funcional del Proyecto (MVP SPEC)

## 1. Visión General
Plataforma SaaS multi-tenant y multi-sucursal diseñada para pequeños y medianos negocios de servicios y comercio (peluquerías, centros de estética, consultorios, talleres mecánicos, comercios de cercanía) en Argentina.

La plataforma ofrece una solución integral combinando:
1. **Agenda de Turnos** (interna y pública)
2. **Facturador y Cobros** (integrado con AFIP)
3. **Control de Stock e Insumos** (por sucursal)

---

## 2. Definición del Cliente Objetivo
- **Negocios con servicios por turnos y venta de productos/insumos:** Salones de belleza, barberías, centros médicos/odontológicos, talleres de servicio técnico, clínicas veterinarias.
- **Estructura Organizacional:** Negocios monosucursal o multi-sucursal con roles diferenciados (`owner`, `admin`, `staff`).
- **Jurisdicción Fiscal:** Argentina (Facturación electrónica AFIP - comprobantes A, B, C y Notas de Crédito).

---

## 3. Alcance del MVP (In-Scope)

### 3.1. Arquitectura Multi-Tenant & Multi-Sucursal
- **Aislamiento de Datos:** Cada tabla de datos incluye `tenant_id`. Todas las consultas filtran automáticamente por el tenant autenticado en la sesión.
- **Sedes/Sucursales (`branches`):** Soporte multi-sucursal nativo desde el día 1. Cada turno, stock y comprobante fiscal está asociado a una sucursal específica.
- **Roles y Permisos (RBAC):**
  - `owner`: Control total del tenant, sucursales, facturación fiscal y suscripción SaaS.
  - `admin`: Gestión operativa de 1 o más sucursales asignadas (agenda, productos, inventario, facturación).
  - `staff`: Acceso restringido a su sucursal asignada, visualización de su propia agenda y atención de turnos.

### 3.2. Módulo 1: Agenda de Turnos
- **Gestión Interna:**
  - Panel tipo calendario (vista diaria/semanal por profesional `staff`).
  - Creación, reprogramación y cancelación de turnos.
  - Estados del turno: `PENDING` (Pendiente), `CONFIRMED` (Confirmado), `COMPLETED` (Completado), `CANCELLED` (Cancelado), `NO_SHOW` (No asistió).
- **Link Público de Reservas:**
  - URL pública por tenant/sucursal (ej: `/b/[tenant-slug]/[branch-slug]`).
  - Selección de servicio, profesional disponible y fecha/hora sin necesidad de login/registro del cliente final.
  - Registro automático del cliente final (`Customer`) mediante nombre, email y teléfono.

### 3.3. Módulo 2: Control de Stock e Insumos
- **Inventario por Sucursal:**
  - Stock independiente por cada sede (`BranchStock`).
  - Tipos de ítems: Productos de reventa (ej: champú) e Insumos de servicio (ej: tinte, guantes).
- **Recetas de Servicios:**
  - Definición de insumos consumidos por cada servicio (ej: 1 servicio de "Coloración" consume 50ml de Tinte X).
- **Movimientos de Stock:**
  - Histórico de movimientos (`IN`, `OUT`, `ADJUSTMENT`, `SALE`, `SERVICE_USAGE`).
  - Alertas visuales de stock mínimo por sucursal.

### 3.4. Módulo 3: Facturador Electrónico & AFIP
- **Integración con AFIP (WSFEv1 / WSAA):**
  - Carga de CUIT, Certificado Digital (.crt) y Clave Privada (.key) por tenant.
  - Selección de Punto de Venta (POS) AFIP por sucursal.
  - Emisión de Facturas A, B, C y Notas de Crédito A, B, C con obtención de CAE y fecha de vencimiento.
  - Entornos de Sandbox/Homologación en desarrollo y Producción en desplegado.
- **Gestión de Clientes (`Customer`):**
  - Registro de CUIT/DNI y Condición de IVA (Responsable Inscripto, Monotributo, Consumidor Final).

### 3.5. Flujo Integrado Semiautomático
- Al cambiar el estado de un turno a `COMPLETED`, la UI habilita el botón **"Cobrar"**.
- Al presionar "Cobrar", se abre el módulo de facturación prellenado con:
  - Datos del cliente.
  - Servicio prestado y precio.
  - Opción de agregar productos de reventa adicionales.
- Al confirmar y emitir el comprobante:
  1. Se genera la Factura (con o sin CAE AFIP según configuración).
  2. Se deduce automáticamente el stock de la sucursal (productos vendidos + insumos de la receta del servicio).

### 3.6. Modelo de Suscripción SaaS (Pricing)
- **Modo Trial:** 14 días de prueba gratuita sin tarjeta de crédito.
- **Planes:**
  - *Starter:* 1 sucursal, hasta 3 usuarios staff, sin AFIP.
  - *Pro:* Multi-sucursal ilimitada, usuarios ilimitados, AFIP habilitado.
- **Pasarela de Pagos:** Mercado Pago Subscriptions API (cobro mensual recurrente).

---

## 4. Fuera del Alcance del MVP (Out-of-Scope)

- **Legislaciones Fiscales Internacionales:** No se soportarán entes fiscales fuera de Argentina (SAT, DIAN, SII) en la versión initial.
- **Bot de WhatsApp Automático:** Notificaciones automáticas por WhatsApp Business API (se enviarán mails básicos o se dejará listo el webhook para fases futuras).
- **Señas / Cobro por Adelantado en Booking Público:** La reserva pública no exigirá pago previo en el MVP.
- **Contabilidad General y Liquidación de Sueldos:** No se incluyen libros diarios, balances ni comisiones complejas de liquidación a empleados.
- **Integración con Posnet Hardware / Lectores Fiscales:** No se conectará con hardware de cobro físico vía USB/Serial.

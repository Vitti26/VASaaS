# VASaaS - Plataforma SaaS Multi-Tenant & Multi-Sucursal

> **Gestión de Agenda, Facturación AFIP y Control de Stock para Pequeños Negocios en Argentina**

---

## 📋 Requisitos Previos

- **Node.js**: v20.x o superior
- **Docker & Docker Desktop**: v24.x o superior
- **Git**

---

## 🚀 Guía de Inicio Rápido para Desarrolladores

### 1. Clonar el Repositorio y Configurar Variables de Entorno

```bash
# Clonar el proyecto
git clone <repository-url>
cd SaaS

# Copiar el archivo de entorno de ejemplo
cp .env.example .env
```

### 2. Levantar la Base de Datos PostgreSQL con Docker

Asegúrate de que **Docker Desktop** esté abierto y en ejecución en tu equipo, luego ejecuta:

```bash
# Levantar contenedor de PostgreSQL en segundo plano (Puerto 5432)
docker compose up -d postgres
```

### 3. Ejecutar Migraciones de Base de Datos

> **Diferencia entre `prisma migrate` y `prisma db push`:**
> * `npx prisma db push`: Sincroniza el esquema directamente sin guardar historial. Se usa solo para prototipado rápido.
> * `npx prisma migrate dev`: **(Recomendado)** Crea archivos de migración SQL con marca de tiempo en `prisma/migrations/`, registrando un historial inmutable de cambios de esquema. Esto garantiza despliegues seguros y reproducibles en desarrollo, staging y producción sin pérdida de datos.

```bash
# Generar cliente de Prisma y aplicar migraciones
npx prisma migrate dev --name init
```

### 4. Cargar Datos de Prueba (Seed)

El script de seed poblará la base de datos con negocios de prueba, sucursales, usuarios (`owner@barberia.com` / `password123`), productos, servicios y citas iniciales.

```bash
# Ejecutar la semilla de datos
npx prisma db seed
```

### 5. Iniciar el Servidor de Desarrollo

```bash
npm run dev
```

La aplicación estará disponible en:
* **Panel SaaS Interno:** `http://localhost:3000/agenda`
* **Portal Público de Reservas:** `http://localhost:3000/b/barberia-central/palermo`

---

## 🧪 Comandos de Verificación y Testing

Antes de realizar un commit o pull request, ejecuta los tres comandos de verificación:

```bash
# 1. Pruebas Unitarias e Integración (Vitest)
npm run test

# 2. Control de Estilo y Código (ESLint)
npm run lint

# 3. Verificación de Tipos Estrictos (TypeScript)
npm run typecheck
```

---

## 🐳 Despliegue Completo en Docker (Producción / Staging)

Para compilar y ejecutar tanto la aplicación Next.js como PostgreSQL en contenedores aislados:

```bash
docker compose up --build -d
```

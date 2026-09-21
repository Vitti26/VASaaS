# Multi-Tenant SaaS - Project Guidelines & AI Agent Rules

This repository hosts a multi-tenant SaaS tailored for small businesses (barbershops, medical/dental offices, auto repair shops, retail stores, etc.). It consists of three primary modules:
1. **Agenda & Appointments** (`/modules/agenda`)
2. **Billing & Invoicing** (`/modules/billing`)
3. **Stock & Inventory Control** (`/modules/stock`)

---

## 1. Technology Stack

* **Framework:** Next.js (App Router)
* **Language:** TypeScript (Strict Mode enabled)
* **Database & ORM:** PostgreSQL + Prisma ORM
* **Styling:** Tailwind CSS (Vanilla CSS for custom styles when needed)
* **Validation:** Zod (Schemas for API requests, forms, and environment variables)
* **Testing:** Vitest

---

## 2. Multi-Tenancy Architecture

* **Tenant Isolation:** Every business entity / database table MUST include a `tenant_id` field.
* **Strict Query Scope:** ALL database queries, updates, and deletes MUST explicitly filter by `tenant_id`.
* **Session Integrity:** NEVER trust a `tenant_id` passed from the client (e.g., query string, request body, headers). The `tenant_id` MUST always be derived securely from the authenticated session on the server side.

---

## 3. Roles & Permissions

* **Supported Roles:** `owner`, `admin`, `staff`
* **Access Control:** Enforce role checks in server actions, API routes, and service layers prior to processing business logic or data retrieval.

---

## 4. Folder Structure & Modular Architecture

* **Modular Directory Organization:**
  * `src/modules/agenda/` - Appointment scheduling, calendar management, and availability logic.
  * `src/modules/billing/` - Invoices, payment processing, tax receipts, and financial records.
  * `src/modules/stock/` - Inventory management, stock levels, products, and movements.
  * `src/modules/shared/` - Cross-cutting utilities, common database access, session resolvers, and shared UI primitives.
* **Separation of Concerns:** Business logic (domain services, validation, calculations) MUST be decoupled from UI React components and API handlers.

---

## 5. Development Rules & Operational Principles

1. **Dependency Management:** Never install third-party dependencies (`npm install`, `pnpm add`, etc.) without notifying and confirming with the user first.
2. **Business Logic Testing:** Every piece of domain logic (pricing, availability calculations, stock decrements, tax computations) MUST have corresponding Vitest test coverage.
3. **Decision Summaries:** Explain every key architectural or technical decision concisely (in ~2 lines).
4. **Environment Variables & Secrets:** NEVER hardcode secrets, API keys, or connection strings. Always use `.env` files and validate env variables via Zod schemas.
5. **Mandatory Post-Task Verification:** After finishing any task, run tests, linter, and typechecker:
   * `npm run test` (Vitest)
   * `npm run lint` (ESLint)
   * `npm run typecheck` (`tsc --noEmit`)

---

## 6. Language & Naming Conventions

* **UI Language:** Spanish (`es`) - All user-facing text, labels, alerts, validation messages, and modals must be in Spanish.
* **Codebase Language:** English (`en`) - All variable names, function names, types, database fields/tables, comments, git commit messages, and documentation must be written in English.

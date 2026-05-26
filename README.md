# AutoOps

Every solution needs a problem — and this one starts with a friend running a local car repair shop with no formal tracking system in place. This app was built to fix that:

- Records — a digital log of all repairs
- Traceability — full history and status of every order
- Deadlines — set and monitor due dates for ongoing work
- Quick answers — instant cost estimates and running totals

---

## Platform

| | Web App | Mobile App |
|---|---|---|
| **Stack** | Next.js + Neon DB + Drizzle ORM + Tailwind | React Native + Expo |
| **Auth** | JWT + bcrypt | Bearer token (JWT) |
| **Role** | Back-end API + web front-end | Mobile client consuming web API |
| **Primary use** | Full capabilities | Order processing focus |
| **Deploy** | https://autoops2.vercel.app | https://autoops2-mobile.vercel.app |

> The **Web App** is capable to work on Mobile devices with full set of capabilities.

## Order Statuses

| Status | Meaning |
|---|---|
| **Booked** | Order created, work not yet started |
| **In Progress** | Actively being worked on |
| **Awaiting** | General pause — no reason required |
| **Payment** | Work complete, awaiting payment |
| **Done** | Fully closed |

---

## Clients & Vehicles

- Vehicles belong to clients
- **Unknown** is a built-in client placeholder for walk-ins or unidentified vehicles
- Vehicles under *Unknown* can be reassigned to a real client by an Admin
- New clients and vehicles can be registered inline during order creation

---

## Parts Catalog

- Name-based lookup only — no pricing stored in the catalog
- Mechanics can add missing parts inline; additions are **immediately available** to all users
- **Admin edits to catalog entries retroactively affect historical orders** — edit with care

---

## Deadlines

- Every order has a deadline set at creation
- Overdue orders are **visually flagged** across the app
- Only **Admins** can modify a deadline after creation

---

## Roles & Permissions

### 🔑 Mechanic
- Create and manage their **own orders** only
- Change order status on their orders
- Register new clients and vehicles
- Add parts to the shared catalog inline
- New accounts are **fully locked out until approved** by an Admin

### 👑 Admin (Main Mechanic)
Everything a Mechanic can do, plus:
- **Full order visibility** — view and edit all orders regardless of ownership + delete
- **Reassign orders** to a different mechanic
- **Modify deadlines** on any order
- **Parts catalog** — full CRUD
- **Clients list** — full CRUD
- **Vehicles List** — full CRUD
- **Insights & Analytics** — exclusive access
- **Account management** — approve pending accounts, activate or deactivate mechanics
- **Set the universal hourly rate** — used for time-based service cost calculations


---

## Insights & Analytics

Accessible to **Admins only**.

<span style="color: hotpink">**Total Orders: For the EXAM Scalability Requirement**</span>

**Year-to-date business performance**
- YTD Revenue: From completed orders — Jan 1 to today
- Backlog Revenue: Open orders not yet marked as Done

**YTD revenue generated**
- Top 5 Clients
- Top 5 Services
- Top 5 Parts

---

## Admin Panel

- Manage mechanic account statuses (pending → active, or deactivate)
- Set the **universal hourly rate** for labor cost calculations

---

## Features Backlog

- Notifications & Alerts — Weekly push notifications (Monday morning & Friday afternoon) prompting mechanics to review and close open orders
- Overdue Criteria & Stats — Clear definition of "not on time" with supporting statistics
- Date Edited Tracking — Timestamp added and surfaced across relevant views
- Extended BI & Analytics — Deeper business intelligence beyond the current Insights scope
- Archive Search & Debug — Search, filter, and inspect closed/archived orders
- Multi-language Support — Bulgarian localization across the full UI, including catalog lists
- Per-mechanic Hourly Rates (planned) — Individual rates based on experience and location, replacing the universal rate
- Implement automated database / file storage backup

---

## Monorepo Structure

This is an npm workspace monorepo with two packages.

```
autoops2/                          npm workspace root
├── package.json                   workspaces config; root dev/build scripts
├── scripts/
│   └── patch-zod.js               post-install zod compatibility patch
│
├── autoops-web/                   Next.js web app (back-end + admin UI)
│   ├── src/
│   │   ├── __tests__/api/         integration tests (Jest)
│   │   ├── actions/               Server Actions
│   │   │   ├── auth.ts            login, register
│   │   │   ├── orders.ts          create/update orders, vehicles, clients, mechanic assignment
│   │   │   ├── admin.ts           account management
│   │   │   └── delete.ts          order deletion
│   │   ├── app/
│   │   │   ├── (app)/             authenticated routes (JWT middleware-gated)
│   │   │   │   ├── dashboard/     orders list with status and mechanic controls
│   │   │   │   ├── orders/        order create + edit forms
│   │   │   │   ├── catalog/       parts catalog tab
│   │   │   │   ├── clients/       client create + edit (with vehicle list)
│   │   │   │   ├── vehicles/      vehicle create + edit
│   │   │   │   ├── insights/      admin-only analytics
│   │   │   │   └── admin/         mechanic account management + hourly rate
│   │   │   ├── (auth)/            public routes
│   │   │   │   ├── login/
│   │   │   │   └── register/
│   │   │   └── api/
│   │   │       ├── order-form/    typeahead search (vehicles, clients, parts, mechanics)
│   │   │       ├── suggestions/   general suggestion endpoint
│   │   │       └── v1/            REST API (auth, orders, catalog, users, settings, docs)
│   │   ├── components/
│   │   │   ├── orders/            OrderForm, StatusBadge, MechanicBadge, modals
│   │   │   └── catalog/           client/vehicle/parts-catalog forms and modals
│   │   ├── db/
│   │   │   ├── schema.ts          Drizzle table definitions
│   │   │   ├── queries.ts         all read queries
│   │   │   ├── migrations/        SQL migration files (Drizzle Kit)
│   │   │   ├── seed.ts            base seed (users, clients, vehicles, parts)
│   │   │   ├── seed-orders.ts     order seed with parts and services
│   │   │   └── seed-test.ts       test database seed
│   │   ├── lib/
│   │   │   ├── session.ts         JWT session helpers (jose)
│   │   │   ├── api-auth.ts        API auth helpers
│   │   │   ├── api-catalog.ts     API catalog helpers
│   │   │   ├── api-orders.ts      API orders helpers
│   │   │   ├── api-openapi.ts     OpenAPI spec generation
│   │   │   ├── api-response.ts    response helpers
│   │   │   └── api-error.ts       error helpers
│   │   └── middleware.ts          route auth guard
│   ├── drizzle.config.ts
│   └── next.config.ts
│
└── autoops-mobile/                React Native / Expo mobile app
    └── src/
        ├── app/
        │   ├── (app)/             authenticated routes
        │   │   ├── orders/        orders list, detail, create, edit
        │   │   ├── catalog/       clients, parts, and vehicles tabs
        │   │   └── profile.tsx    user profile
        │   └── (auth)/
        │       └── login.tsx
        ├── components/
        │   ├── orders/            OrderCard, OrderForm, PartRow, ServiceRow, StatusPicker
        │   ├── catalog/           CatalogList, client/vehicle/part modals, RowActions
        │   └── ui/                ConfirmDialog, SearchableSelect, StatusBadge, Toast, …
        ├── lib/                   API client, auth helpers, types, formatters
        ├── constants/             theme tokens
        └── hooks/                 color scheme, session, and theme hooks
```

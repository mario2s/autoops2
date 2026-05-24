# AutoOps

Car shop operations management system — repair order lifecycle, client and vehicle tracking, parts catalog, and business insights.

---

## Monorepo Structure

This is an npm workspace monorepo with two packages.

```
autoops2/                          npm workspace root
├── package.json                   workspaces config; root dev/build scripts
│
├── autoops-web/                   Next.js web app (back-end + admin UI)
│   ├── src/
│   │   ├── actions/               Server Actions
│   │   │   ├── auth.ts            login, register
│   │   │   ├── orders.ts          create/update orders, vehicles, clients, mechanic assignment
│   │   │   ├── admin.ts           account management
│   │   │   └── delete.ts          order deletion
│   │   ├── app/
│   │   │   ├── (app)/             authenticated routes (JWT middleware-gated)
│   │   │   │   ├── dashboard/     orders list with status and mechanic controls
│   │   │   │   ├── orders/        order create + edit forms
│   │   │   │   ├── catalog/       parts, clients, and vehicles tabs
│   │   │   │   ├── clients/       client create + edit (with vehicle list)
│   │   │   │   ├── vehicles/      vehicle create + edit
│   │   │   │   ├── insights/      admin-only analytics
│   │   │   │   └── admin/         mechanic account management + hourly rate
│   │   │   ├── (auth)/            public routes
│   │   │   │   ├── login/
│   │   │   │   └── register/
│   │   │   └── api/
│   │   │       ├── order-form/    typeahead search (vehicles, clients, parts, mechanics)
│   │   │       └── suggestions/   general suggestion endpoint
│   │   ├── components/
│   │   │   ├── orders/            OrderForm, StatusBadge, MechanicBadge, modals
│   │   │   └── catalog/           client/vehicle/parts-catalog forms and modals
│   │   ├── db/
│   │   │   ├── schema.ts          Drizzle table definitions
│   │   │   ├── queries.ts         all read queries
│   │   │   ├── migrations/        SQL migration files (Drizzle Kit)
│   │   │   ├── seed.ts            base seed (users, clients, vehicles, parts)
│   │   │   └── seed-orders.ts     order seed with parts and services
│   │   ├── lib/
│   │   │   └── session.ts         JWT session helpers (jose)
│   │   └── middleware.ts           route auth guard
│   ├── drizzle.config.ts
│   └── next.config.ts
│
└── autoops-mobile/                React Native / Expo mobile app
    └── src/
        ├── app/                   Expo Router screens (_layout, index, explore)
        ├── components/            shared UI (tabs, themed text/view, icons)
        ├── constants/             theme tokens
        └── hooks/                 color scheme + theme hooks
```

### Root scripts

| Command | What it does |
|---|---|
| `npm run dev` | Starts both web (`next dev`) and mobile (`expo start`) in parallel |
| `npm run build` | Builds all workspaces |

### Web scripts (`-w autoops-web`)

| Command | What it does |
|---|---|
| `npm run dev` | Next.js dev server |
| `npm run build` | Production build |
| `npm run db:generate` | Generate Drizzle migrations from schema changes |
| `npm run db:migrate` | Apply pending migrations to the database |
| `npm run db:studio` | Open Drizzle Studio (DB browser) |
| `npm run db:seed` | Seed base data |
| `npm run db:seed-orders` | Seed realistic order data |

### Mobile scripts (`-w autoops-mobile`)

| Command | What it does |
|---|---|
| `npm run start` | Expo dev server |
| `npm run ios` | Run on iOS simulator |
| `npm run android` | Run on Android emulator |
| `npm run web` | Run in browser via Expo Web |

---

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
- Register new clients and vehicles inline during order creation
- Add parts to the shared catalog inline
- New accounts are **fully locked out until approved** by an Admin

### 👑 Admin
Everything a Mechanic can do, plus:
- **Full order visibility** — view and edit all orders regardless of ownership
- **Reassign orders** to a different mechanic
- **Modify deadlines** on any order
- **Parts catalog** — full edit access (add, edit, remove); changes affect historical data
- **Clients list** — full edit access, including vehicle reassignment
- **Insights & Analytics** — exclusive access
- **Account management** — approve pending accounts, activate or deactivate mechanics
- **Set the universal hourly rate** — used for time-based service cost calculations

> 💡 **Future:** Per-mechanic rates based on experience and location are planned but not in scope.

---

## Insights & Analytics

Accessible to **Admins only**.

**Mechanic Performance**
- Revenue generated
- Average revenue per order
- On-time completion rate

**Client Analytics**
- Revenue generated
- Average revenue per order
- Number of orders in the last 12 months

**Operations**
- Active order backlog and deadline overview
- Revenue trends and order throughput

---

## Platform

| | Web App | Mobile App |
|---|---|---|
| **Stack** | Next.js + Neon DB + Drizzle ORM + Tailwind | React Native + Expo |
| **Auth** | JWT + bcrypt | Bearer token (JWT) |
| **Role** | Back-end API + web front-end | Mobile client consuming web API |
| **Primary use** | Admin, insights, account management | Order processing (primary interface) |

> Mobile is the **primary interface for order processing**. The web app is the primary interface for admin operations and insights.

---

## Admin Panel

- Manage mechanic account statuses (pending → active, or deactivate)
- Set the **universal hourly rate** for labor cost calculations

---

## Key Features

- ✅ Repair order lifecycle — Booked → In Progress → Awaiting → Payment → Done
- ✅ Parts and services segments with automatic subtotals and grand total
- ✅ Flexible labor cost — hourly (universal rate) or fixed per job
- ✅ Parts catalog with inline creation; per-order pricing (no catalog prices)
- ✅ Inline client and vehicle registration during order creation
- ✅ Unknown client placeholder with admin vehicle reassignment
- ✅ Deadline tracking with visual overdue flagging
- ✅ Role-based access — Mechanic and Admin
- ✅ Admin approval and activation workflow for mechanic accounts
- ✅ Universal hourly rate management via admin panel
- ✅ Insights and analytics (Admin only) — mechanic performance, client stats
- ✅ Responsive web UI + React Native mobile app

---

## Out of Scope

- 🔔 **Notifications** — not in current scope; planned for future development
- 💰 **Per-mechanic hourly rates** — planned for future (based on experience and location)
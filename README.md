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
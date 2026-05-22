# AutoOps — Next.js Car Shop Operations App

Full-stack app for automating car shop operations, order management, and business insights.

## Stack

- **Framework:** Next.js (App Router)
- **Database:** Neon DB + Drizzle ORM
- **Styling:** Tailwind CSS
- **Auth:** JWT + bcrypt

## Architecture

- **Service layer** handles all business logic — consumed by both API routes and Server Actions
- **Modular design** — keep components self-contained; split files when logic grows complex
- **API:** RESTful endpoints for external access; Server Actions for internal form/mutation flows

## Rendering

- Default to **Server Components**
- Use **Client Components** only for: browser APIs, interactivity, and controlled form inputs
- Mark client components explicitly with `"use client"` at the top

## UI

- Modern, responsive design using Tailwind utility classes
- Follow mobile-first breakpoints

## Database Schema

- Schema definition: `src/db/schema.ts`
- Migrations: `src/db/migrations/`
- Seed script: `src/db/seed.ts`
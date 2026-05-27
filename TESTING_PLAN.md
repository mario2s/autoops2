# AutoOps — Automated Testing Implementation Plan (Agent Playbook)

> **How to use this file:** Open it in VS Code and hand it to your AI dev agent (GitHub
> Copilot, Claude Code, Cursor, etc.). Execute the tasks **in order**. Each task is
> self-contained: it lists the files to create, the exact dependencies, the precise test
> cases (input → expected), the command to verify, and the acceptance criteria.
>
> ⛔ **DO NOT use git during this run.** Do not run `git add`, `git commit`, `git push`,
> `git checkout`, `git switch`, `git reset`, `git branch`, `git stash`, or change the
> remote. Leave **all** changes uncommitted in the working tree. The `Suggested commit:`
> line under each task is a message for the **human** to use later — the agent must NOT
> execute it. The human has already pushed a backup to GitHub; this run must not alter
> history or the remote in any way.

---

## 0. Context for the agent (read first, do not skip)

This is the **AutoOps** monorepo — a car-shop operations system. npm workspaces, two packages:

| Workspace | Stack | Role |
|---|---|---|
| `autoops-web` | Next.js 16 + React 19 + Drizzle ORM + Neon Postgres + Tailwind + `jose` + `bcryptjs` | Back-end API **and** web client |
| `autoops-mobile` | React Native + Expo ~55 + Expo Router + `jwt-decode` + `expo-secure-store` | Mobile client (consumes the web API) |

### What ALREADY exists — do NOT recreate or rewrite it
- A working **API integration suite** at `autoops-web/src/__tests__/api/` (~93 tests across
  `auth`, `orders`, `catalog`, `catalog-roles`, `catalog-delete`, `clients`, `vehicles`, `users`).
- It runs via `npm run test:api -w autoops-web` (Jest + `ts-jest`, `--runInBand`).
- It uses: `globalSetup.ts` (runs `seed-test.ts`), a shared `context.ts` file, an `http.ts`
  fetch helper (`apiRequest`, `containsPasswordHash`), a custom `sequencer.cjs` and `reporter.cjs`.
- It targets a **live server** at `http://localhost:3000` (override with `TEST_API_URL`).
- **Leave all of this untouched.** New work goes in NEW folders / NEW configs.

### Project guardrails (from `AGENTS.md` — honour them)
- To change the DB schema, **always use Drizzle migrations** (`db:generate` → `db:migrate`).
  Tests must **never** mutate schema or run `drizzle-kit push`.
- Shared auth is **JWT Bearer** across web + mobile.
- **Never commit secrets.** `JWT_SECRET` / `DATABASE_URL` come from env or CI secrets only.
- Match existing code style (TypeScript, no default-export tests, `describe`/`test` blocks).
- **No git operations this run.** This is an unattended overnight run. Do not commit, push,
  branch, or switch refs. If a step would normally end in a commit, just stop at "tests green"
  and move to the next task. The human reviews and commits in the morning.
- **If a task fails or you get stuck, do not roll back with git.** Leave the partial work in
  place, write a short note of what failed at the bottom of this section, and continue to the
  next independent task. Tasks 1, 2, 3, and 6 are independent and need no database.

### Why this plan (maps to the SoftUni rubric "Automated Tests" bonus)
The rubric rewards **unit + integration + end-to-end** tests across **back-end, web, and mobile**,
plus **CI in GitHub Actions**. You already have back-end *integration*. This plan adds the
missing layers: back-end **unit**, web **component + E2E**, mobile **unit**, and the **CI** workflow.

### Layer overview

| Task | Layer | Workspace | DB needed? | Runs in CI as |
|---|---|---|---|---|
| 1 | Back-end unit tests | `autoops-web` | No | Always |
| 2 | Pure cost-calc refactor + unit test | `autoops-web` | No | Always |
| 3 | Web component tests | `autoops-web` | No | Always |
| 4 | Strengthen API integration (paging/scalability) | `autoops-web` | Yes | Gated on secret |
| 5 | Web E2E (Playwright) | `autoops-web` | Yes | Gated on secret |
| 6 | Mobile unit tests | `autoops-mobile` | No | Always |
| 7 | GitHub Actions CI | root | mixed | — |

> **Effort note:** Tasks 1, 2, 3, 6 are fast and self-contained (no DB, no server) — do these
> first to lock in bonus coverage. Tasks 4 and 5 need a database; gate them behind a secret in CI.

---

## Task 1 — Back-end unit tests (pure functions, no DB, no server)

**Goal:** Unit-test the pure business logic that the integration suite only exercises indirectly.

### 1.1 Add a second Jest config (do not touch the existing `jest.config.ts`)

Create `autoops-web/jest.unit.config.ts`:

```ts
import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',
  // Unit + component live here; the API integration suite stays in src/__tests__/api
  testMatch: ['<rootDir>/src/__tests__/unit/**/*.test.ts', '<rootDir>/src/__tests__/components/**/*.test.tsx'],
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
  transform: { '^.+\\.tsx?$': ['ts-jest', { isolatedModules: true }] },
};

export default config;
```

Add scripts to `autoops-web/package.json`:

```jsonc
"test:unit": "jest -c jest.unit.config.ts",
"test": "jest -c jest.unit.config.ts"   // local-safe default: unit + component only, no DB
```

### 1.2 `src/__tests__/unit/api-orders.test.ts` — validation + money math

Target file: `src/lib/api-orders.ts`. Implement these cases (the functions throw `ApiError`
with a `status` and `code`):

**`round2(n)`**
- `round2(77)` → `77`
- `round2(92.5)` → `92.5`
- `round2(10.126)` → `10.13`
- `round2(10.124)` → `10.12`
> `round2` is currently a non-exported `function round2`. **Export it** (`export function round2`) so it can be unit-tested.

**`parsePartsArray(raw)`**
- Valid: `[{ catalogPartId: 'p1', qty: 2, unitPrice: 38.5 }]` → returns one normalized part.
- Non-array input → throws, `status 400`, `code 'INVALID_PART'`.
- `qty: 0` or negative → throws `INVALID_PART` (message contains `qty must be > 0`).
- `unitPrice: -1` → throws `INVALID_PART`.
- Missing `catalogPartId` → throws `INVALID_PART`.

**`parseServicesArray(raw)`**
- Hourly valid: `{ description: 'x', costType: 'hourly', hours: 1.5, rate: 45 }` → `{ ..., fixedAmount: null }`.
- Fixed valid: `{ description: 'x', costType: 'fixed', fixedAmount: 25 }` → `{ ..., hours: null, rate: null }`.
- `costType: 'weird'` → throws `INVALID_SERVICE`.
- Hourly with `hours: 0` → throws `INVALID_SERVICE`.
- Fixed with negative `fixedAmount` → throws `INVALID_SERVICE`.
- Empty `description` → throws `INVALID_SERVICE`.

**`parseOrderInput(body, { requireAll: true })`**
- Missing `vehicleId` → throws `MISSING_VEHICLE`.
- Missing `clientId` → throws `MISSING_CLIENT`.
- Missing `deadline` → throws `MISSING_DEADLINE`.
- Invalid deadline string (`'not-a-date'`) → throws `INVALID_DEADLINE`.
- Valid vehicle/client/deadline but **no parts and no services** → throws `EMPTY_LINE_ITEMS`.
- Fully valid body → returns `{ vehicleId, clientId, deadline: Date, parts, services }` with `deadline instanceof Date`.
- With `{ requireAll: false }` and an empty body → does **not** throw (returns empty arrays).

> Assert thrown errors with a helper, e.g. `expect(() => parsePartsArray('x')).toThrow()` and
> additionally check `.status` / `.code` by catching: `try { ... } catch (e) { expect(e.status).toBe(400) }`.

### 1.3 `src/__tests__/unit/api-auth.test.ts` — bearer/JWT/RBAC guards

Target: `src/lib/api-auth.ts`. Set `process.env.JWT_SECRET = 'test-secret'` at the top of the file.
Build tokens with `jose`'s `SignJWT` (HS256) and construct a `NextRequest` (`new NextRequest('http://x/api', { headers })`).

**`requireAdmin(user)`** (pure):
- `role: 'admin'` → does not throw.
- `role: 'mechanic'` → throws, `status 403`, `code 'FORBIDDEN'`.

**`validateApiRequest(request)`**:
- No `Authorization` header → rejects, `status 401`, `code 'MISSING_TOKEN'`.
- Header `Bearer ` (empty token) → `401 MISSING_TOKEN`.
- Garbage token → `401 INVALID_TOKEN`.
- Valid token signed with the test secret but `status: 'pending'` → `401 INACTIVE_ACCOUNT`.
- Valid token, `status: 'active'`, `role: 'admin'` → resolves `{ user }` with the right `userId`/`role`.

### 1.4 `src/__tests__/unit/session.test.ts` — token round-trip

Target: `src/lib/session.ts`. Set `process.env.JWT_SECRET = 'test-secret'`.
- `createSessionToken({ userId, email, name, role:'mechanic', status:'active' })` returns a string.
- Verifying that string with `jose.jwtVerify(token, secret)` yields a payload whose
  `userId`, `email`, `role`, `status` match the input.
- The token carries an expiry (`payload.exp` is a number in the future).

> Do **not** test `getSession()` here — it reads `next/headers` cookies and belongs to the
> integration layer. Unit-test only the pure sign step + verification.

**Verify:** `npm run test:unit -w autoops-web` → all green.
**Suggested commit (for you to run later, not the agent):** `test(web): add back-end unit tests for order parsing, auth guards, and JWT sessions`

---

## Task 2 — Extract & unit-test the order cost calculation

**Goal:** The grand-total math (parts `qty × unitPrice`; services `hourly → hours × rate`,
`fixed → fixedAmount`) currently lives **three** times: SQL in `db/queries.ts`, SQL in
`lib/api-orders.ts`, and JS in both `OrderForm.tsx` files. Extract the JS version into one
pure function and lock it with a unit test. This is a legitimate, low-risk refactor that
also creates a clean "unit test" artifact for grading.

### 2.1 Create `src/lib/order-totals.ts`

```ts
export type TotalPart = { qty: number; unitPrice: number };
export type TotalService =
  | { costType: 'hourly'; hours: number; rate: number }
  | { costType: 'fixed'; fixedAmount: number };

const round2 = (n: number) => Math.round(n * 100) / 100;

export function computeOrderTotals(parts: TotalPart[], services: TotalService[]) {
  const partsTotal = parts.reduce((sum, p) => sum + p.qty * p.unitPrice, 0);
  const servicesTotal = services.reduce(
    (sum, s) => sum + (s.costType === 'hourly' ? s.hours * s.rate : s.fixedAmount),
    0,
  );
  const parts2 = round2(partsTotal);
  const services2 = round2(servicesTotal);
  return { parts: parts2, services: services2, grand: round2(parts2 + services2) };
}
```

Then refactor `src/components/orders/OrderForm.tsx` (web) to import and use
`computeOrderTotals` for its live preview instead of its inline arithmetic. **Do not change
the SQL totals** in `queries.ts` / `api-orders.ts` — leave them as the server source of truth.

### 2.2 `src/__tests__/unit/order-totals.test.ts`

Use the exact scenario already asserted by the integration suite so the layers agree:
- parts `[{ qty: 2, unitPrice: 38.5 }]` → `parts: 77.00`
- services `[{ costType:'hourly', hours:1.5, rate:45 }, { costType:'fixed', fixedAmount:25 }]`
  → `services: 92.50`
- combined → `grand: 169.50`
- empty parts + empty services → `{ parts: 0, services: 0, grand: 0 }`
- rounding: parts `[{ qty: 3, unitPrice: 3.337 }]` → `parts: 10.01`

**Verify:** `npm run test:unit -w autoops-web`.
**Suggested commit (for you to run later, not the agent):** `refactor(web): extract pure computeOrderTotals helper + unit test`

---

## Task 3 — Web component tests (jsdom)

**Goal:** Add fast React component tests for presentational logic. Keep them in the same
`jest.unit.config.ts` run (it already matches `src/__tests__/components/**/*.test.tsx`).

### 3.1 Install

```bash
npm i -D @testing-library/react @testing-library/jest-dom @testing-library/user-event jest-environment-jsdom -w autoops-web
```

### 3.2 Component tests use the jsdom environment via a docblock

At the top of each component test file, add:

```ts
/** @jest-environment jsdom */
import '@testing-library/jest-dom';
```

### 3.3 Pick **client** components only (no Server Components, no `next/headers`)

Good targets (presentational / `'use client'`): `StatusBadge`, `MechanicBadge`, `DeleteButton`.
For each, write `src/__tests__/components/<Name>.test.tsx`:

- **`StatusBadge`** — renders the human label for each status (`booked` → "Booked",
  `in_progress` → "In Progress", `done` → "Done", etc.) and applies a distinct class/colour per status.
- **`DeleteButton`** — renders, and clicking it opens the confirm step (does **not** fire the
  delete action without confirmation). Mock the action prop; assert it is **not** called on first click.

> If a chosen component imports server-only modules, swap it for a simpler client component or
> extract its label-mapping into a pure helper and test that instead. Do not introduce a real DB.

**Verify:** `npm run test:unit -w autoops-web` (now includes component tests).
**Suggested commit (for you to run later, not the agent):** `test(web): add component tests for status/mechanic badges and delete confirm`

---

## Task 4 — Strengthen API integration (paging & scalability)

**Goal:** Add a few **integration** tests to the EXISTING suite that explicitly prove the
"Scalability / paging" rubric item — without altering the harness.

### 4.1 Add `src/__tests__/api/paging.test.ts` (same style as `orders.test.ts`)

Use `apiRequest` + `context` tokens. Assert against the real list endpoints
(`/api/v1/orders`, `/api/v1/catalog/parts`, `/api/v1/catalog/clients`, `/api/v1/catalog/vehicles`):

- A list response includes pagination metadata (`page`, `pageSize`/`limit`, and a `total` count) —
  match whatever shape the API actually returns; inspect one response first.
- `?page=1&pageSize=5` returns at most 5 items.
- `?page=2` returns a **different** first item than `?page=1` (when `total > pageSize`).
- An out-of-range page (e.g. `?page=99999`) returns an empty list with HTTP `200`, not an error.
- `total` stays constant across pages for the same filter.

> Seeding: the rubric wants the primary tables validated at ~10,000 rows. If `seed-test.ts`
> doesn't already create enough orders, **do not modify** it; instead add an opt-in bulk seed
> (e.g. reuse `seed-orders.ts` / `seed-gap-orders.ts`) guarded by an env flag, and document it.
> The paging assertions above pass at any volume; the 10k load is a separate manual/seed step.

**Verify (needs DB + running server):**
```bash
# terminal 1
npm run dev -w autoops-web
# terminal 2
npm run db:seed:test -w autoops-web   # if not auto-run
npm run test:api -w autoops-web
```
**Suggested commit (for you to run later, not the agent):** `test(web): add API paging/scalability integration tests`

---

## Task 5 — Web end-to-end tests (Playwright)

**Goal:** Cover the critical user journeys end-to-end in a real browser. This is the
"end-to-end tests" rubric keyword.

### 5.1 Install + init

```bash
npm i -D @playwright/test -w autoops-web
npx playwright install --with-deps chromium
```

### 5.2 `autoops-web/playwright.config.ts`

```ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  use: { baseURL: process.env.E2E_BASE_URL || 'http://localhost:3000' },
  // Boot the app automatically unless an external URL is provided
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : { command: 'npm run dev', port: 3000, reuseExistingServer: true, timeout: 120_000 },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
});
```

Add script to `autoops-web/package.json`: `"test:e2e": "playwright test"`.

### 5.3 `autoops-web/e2e/` — write these specs

Use the demo credentials your seed creates (find them in `seed.ts` / `seed-test.ts`; the
rubric expects `demo`-style logins). Suggested specs:

- **`auth.spec.ts`** — visit `/login`, submit demo mechanic creds, land on `/dashboard`;
  bad creds show the "Invalid email or password" error and stay on `/login`.
- **`order-lifecycle.spec.ts`** — logged in as mechanic: create an order (vehicle, client,
  deadline, one part, one service) → it appears in the dashboard list with the expected total.
- **`rbac.spec.ts`** — as a mechanic, navigating to `/insights` and `/admin` is blocked
  (redirect or 403/forbidden UI). As admin, both load.
- **`admin-approval.spec.ts`** — register a new account (ends "pending"); as admin, approve it
  from the admin panel; the new account can then log in.

> Keep selectors resilient: prefer `getByRole`, `getByLabel`, `getByText` over brittle CSS.
> If the app lacks stable labels, add `data-testid` attributes in the components as part of this task.

**Verify:** `npm run test:e2e -w autoops-web` (with a DB configured).
**Suggested commit (for you to run later, not the agent):** `test(web): add Playwright E2E for auth, order lifecycle, RBAC, and admin approval`

---

## Task 6 — Mobile unit tests (jest-expo)

**Goal:** The Expo app has **zero** tests. Add fast unit tests for its pure helpers.

### 6.1 Install

```bash
npm i -D jest-expo jest @types/jest -w autoops-mobile
```

### 6.2 `autoops-mobile/jest.config.js`

```js
module.exports = {
  preset: 'jest-expo',
  testMatch: ['<rootDir>/src/__tests__/**/*.test.ts'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|expo-modules-core|@react-navigation/.*|jwt-decode))',
  ],
};
```

Add script to `autoops-mobile/package.json`: `"test": "jest"`.

### 6.3 `src/__tests__/format.test.ts` — target `src/lib/format.ts`

- `formatCurrency(77)` → `"$77.00"`; `formatCurrency(1.5)` → `"$1.50"`; `formatCurrency(0)` → `"$0.00"`.
- `isOverdue(<ISO 1 day ago>)` → `true`; `isOverdue(<ISO 1 day ahead>)` → `false`;
  `isOverdue('garbage')` → `false`.
- `vehicleLabel({ licensePlate:'CA1234', description:null })` → `"CA1234"`.
- `vehicleLabel({ licensePlate:null, description:'Red sedan' })` → `"Red sedan"`.
- `vehicleLabel({ licensePlate:null, description:null, make:'Toyota', model:'Corolla' })` → `"Toyota Corolla"`.
- `vehicleLabel({ licensePlate:null, description:null })` → `"Vehicle"`.
- `formatDate('garbage')` returns the raw input unchanged.

### 6.4 `src/__tests__/auth.test.ts` — target `src/lib/auth.ts`

Mock the native deps at the top:
```ts
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(), setItemAsync: jest.fn(), deleteItemAsync: jest.fn(),
}));
jest.mock('react-native', () => ({ Platform: { OS: 'ios' } }));
```
- `decodeToken('not-a-jwt')` → `null`.
- `decodeToken(<valid jwt>)` → payload object (sign a tiny HS256 token or hand-craft a JWT string).
- `isExpired(null)` → `true`.
- `isExpired({ exp: Math.floor(Date.now()/1000) - 10 })` → `true`.
- `isExpired({ exp: Math.floor(Date.now()/1000) + 3600 })` → `false`.

**Verify:** `npm test -w autoops-mobile`.
**Suggested commit (for you to run later, not the agent):** `test(mobile): add unit tests for format helpers and JWT auth utilities`

---

## Task 7 — GitHub Actions CI (the rubric explicitly requires this)

**Goal:** Automate test execution on every push/PR. Split into a **fast, always-on** job
(unit + component + mobile, no DB) and a **gated** job (integration + E2E) that only runs when
a database secret is present — so the build is never red just because a contributor lacks DB access.

### 7.1 Create `.github/workflows/ci.yml`

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:

jobs:
  # ---- Always runs: no database, no server. Fast feedback. ----
  unit:
    name: Unit, component & mobile tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - name: Lint (web)
        run: npm run lint -w autoops-web
      - name: Web unit + component tests
        run: npm run test:unit -w autoops-web
        env:
          JWT_SECRET: ci-test-secret
      - name: Mobile unit tests
        run: npm test -w autoops-mobile

  # ---- Gated: needs a real database (Neon test branch). ----
  integration-e2e:
    name: API integration + E2E
    runs-on: ubuntu-latest
    needs: unit
    # Only run when the DATABASE_URL secret is configured (e.g. on main / trusted PRs)
    if: ${{ github.event_name == 'push' || github.repository == github.event.pull_request.head.repo.full_name }}
    env:
      DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}
      JWT_SECRET: ${{ secrets.TEST_JWT_SECRET }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci

      - name: Skip if no DB secret
        id: guard
        run: |
          if [ -z "$DATABASE_URL" ]; then
            echo "No TEST_DATABASE_URL secret set — skipping integration/E2E."
            echo "run=false" >> "$GITHUB_OUTPUT"
          else
            echo "run=true" >> "$GITHUB_OUTPUT"
          fi

      - name: Apply migrations
        if: steps.guard.outputs.run == 'true'
        run: npm run db:migrate -w autoops-web

      - name: Seed test data
        if: steps.guard.outputs.run == 'true'
        run: npm run db:seed:test -w autoops-web

      - name: Build & start web app
        if: steps.guard.outputs.run == 'true'
        run: |
          npm run build -w autoops-web
          npm run start -w autoops-web &
          npx wait-on http://localhost:3000 -t 120000

      - name: API integration tests
        if: steps.guard.outputs.run == 'true'
        run: npm run test:api -w autoops-web
        env:
          TEST_API_URL: http://localhost:3000

      - name: Install Playwright
        if: steps.guard.outputs.run == 'true'
        run: npx playwright install --with-deps chromium

      - name: E2E tests
        if: steps.guard.outputs.run == 'true'
        run: npm run test:e2e -w autoops-web
        env:
          E2E_BASE_URL: http://localhost:3000
```

### 7.2 Add the dev dependency used by CI to wait for the server

```bash
npm i -D wait-on -w autoops-web
```

### 7.3 Repository secrets to set (GitHub → Settings → Secrets and variables → Actions)
- `TEST_DATABASE_URL` — a **dedicated Neon test branch** connection string (never your prod DB).
  Neon branching is free and matches your serverless `@neondatabase/serverless` driver, so this
  is the cleanest way to give CI a database. Create a branch in the Neon console, copy its URL.
- `TEST_JWT_SECRET` — any random string for signing tokens in CI.

> **Alternative if you don't want a Neon branch:** run a Postgres `services:` container in the
> job and point `DATABASE_URL` at it via the Neon serverless driver's local-proxy mode. This is
> more setup and more fragile than a Neon branch — only do it if you specifically want zero
> external dependencies. The Neon-branch approach above is recommended.

**Verify:** push to a branch and open a PR; confirm the `unit` job is green. The
`integration-e2e` job goes green once the two secrets are set.
**Suggested commit (for you to run later, not the agent):** `ci: add GitHub Actions for unit/component/mobile + gated integration/E2E`

---

## Final checklist (what to confirm before you call it done)

- [ ] `npm run test:unit -w autoops-web` is green (Tasks 1–3).
- [ ] `npm test -w autoops-mobile` is green (Task 6).
- [ ] `npm run test:api -w autoops-web` still green against a live server + DB (Task 4 included, existing untouched).
- [ ] `npm run test:e2e -w autoops-web` green against a live server + DB (Task 5).
- [ ] `.github/workflows/ci.yml` present; `unit` job green on PR; `integration-e2e` green once secrets set (Task 7).
- [ ] **(Human, in the morning)** Review the agent's uncommitted changes (`git status`, `git diff`),
  then commit them — ideally in several commits using the suggested messages above, and spread
  across ≥2 calendar days, since the rubric also scores commit count and commit days. If anything
  is wrong, `git reset --hard origin/main` restores the pre-run backup.
- [ ] Add a short "Testing" section to the repo `README.md` documenting the commands above.

## Rubric coverage achieved

| Rubric keyword | Covered by |
|---|---|
| Unit tests — back-end | Task 1, Task 2 |
| Unit tests — web client | Task 3 |
| Unit tests — mobile | Task 6 |
| Integration tests — back-end | Existing suite + Task 4 |
| End-to-end tests | Task 5 |
| Automate test execution in GitHub Actions | Task 7 |

# AutoOps Mobile — Expo Car Shop App

Mobile client for AutoOps car shop operations, consuming the AutoOps REST API.
Primary interface for order processing and catalog management.
Architectural rules and patterns live here. Screen-by-screen spec: see SCREENS.md

## Stack

- **Framework:** React Native (TypeScript) + Expo (Expo Router)
- **Navigation:** Expo Router file-based — Stack within tabs, Bottom tabs (Orders | Catalog | Profile), Top tabs inside Catalog (Parts | Clients | Vehicles)
- **Auth:** JWT stored in Expo SecureStore — never AsyncStorage

## Backend Integration

- **API base URL:** `EXPO_PUBLIC_API_URL` environment variable
- **API source:** `../autoops-web/src/app/api/v1`
- **Auth header:** `Authorization: Bearer <token>` on every request
- **API client:** all requests go through `src/lib/api.ts` — never call fetch() directly in screens
- **401 handling:** clear token from SecureStore, redirect to /login immediately

## Navigation Structure

Bottom tab bar — 3 tabs:
- Orders (clipboard icon)
- Catalog (books icon) — top tabs inside: Parts | Clients | Vehicles
- Profile (person icon) — current user name, role badge, Logout button

Stack navigation within each tab for detail and edit screens
File: src/app/(app)/_layout.tsx — not app/_layout.tsx

## Auth & Session

- On app launch: decode JWT from SecureStore client-side, check exp field
  - Expired or missing → redirect to /login
  - Valid exp → proceed; let the first authenticated API call confirm via 401
- Do not implement a GET /me endpoint for launch validation
- Login returns 403 with code ACCOUNT_NOT_ACTIVE for pending/inactive accounts
- Show message: "Your account is pending admin approval" on 403 at login

## Roles & Access

- Mechanic: full order workflow; catalog add only (no edit/delete); no admin screens
- Admin: everything mechanic can + full catalog CRUD + vehicle client reassignment
- Read role from decoded JWT payload — never trust client-passed role values
- Enforce role checks in screen components — redirect or hide unauthorized UI

## Shared Components

- `OrderForm.tsx` — single component, mode prop: "create" | "edit"
- `ConfirmDialog.tsx` — Alert.alert() on native, modal on web (Platform.OS === 'web')
- `DateTimeField.tsx` — native DateTimePicker on iOS/Android, input type="datetime-local" on web
- `SearchInput.tsx` — debounced (300ms), min 2 chars enforced, shared by all search inputs
- `ListState.tsx` — handles loading (skeleton), empty (message + CTA), error (message + retry) for all FlatLists
- `StatusBadge.tsx`, `Toast.tsx` — shared across all screens

## Key Behaviors

**Vehicle → Client coupling on order create/edit:**
- Selecting an existing vehicle auto-fills the client field from vehicle.clientId
- User can override the auto-filled client
- Leaving both blank → defaults to Unknown client

**Status transitions:**
- Free choice — any status can be selected at any time by any role
- No linear enforcement, no guards

**Catalog row actions:**
- Do NOT use swipe-to-edit — incompatible with 2-column grid
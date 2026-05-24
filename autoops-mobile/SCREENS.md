# AutoOps Mobile — Screen Specifications

11 screens total. Architecture rules and patterns in AGENTS.md.

## File Structure

src/app/
├── index.tsx                          ← decode JWT exp; redirect to /orders or /login
├── (auth)/
│   └── login.tsx                      ← Login screen
└── (app)/
    ├── _layout.tsx                    ← Bottom tab layout (Orders | Catalog | Profile)
    ├── orders/
    │   ├── index.tsx                  ← Orders list
    │   ├── new.tsx                    ← Create order
    │   └── [id]/
    │       ├── index.tsx              ← Order detail
    │       └── edit.tsx               ← Edit order
    ├── catalog/
    │   ├── _layout.tsx                ← Top tab layout (Parts | Clients | Vehicles)
    │   ├── parts/
    │   │   ├── index.tsx              ← Parts list
    │   │   └── [id]/edit.tsx          ← Edit part (admin only)
    │   ├── clients/
    │   │   ├── index.tsx              ← Clients list
    │   │   └── [id]/edit.tsx          ← Edit client (admin only)
    │   └── vehicles/
    │       ├── index.tsx              ← Vehicles list
    │       └── [id]/edit.tsx          ← Edit vehicle + reassign client (admin only)
    └── profile/
        └── index.tsx                  ← Profile tab (inline, not stack)

---

## Screen 1: Login
File: (auth)/login.tsx

- Email + password inputs
- Login button
- On success: store JWT in SecureStore, redirect to /orders
- On 401: inline error "Invalid email or password"
- On 403 (ACCOUNT_NOT_ACTIVE): "Your account is pending admin approval"
- No register screen — registration is web only

---

## Screen 2: Orders List
File: (app)/orders/index.tsx

- Page title: "Orders"
- Top-right: "+ New" button → /orders/new
- Horizontal scrollable status filter pills:
  Booked | In progress (default active) | Awaiting | Payment | Done | All
- FlatList of OrderCard components — paginated, 20 per page, infinite scroll
- Each OrderCard shows:
  - Vehicle plate or description (primary)
  - Client name (secondary)
  - Status badge (StatusBadge component)
  - Deadline — red text if overdue (compare deadline vs Date.now() client-side)
  - Grand total (calculated from parts + services)
- Pull-to-refresh
- ListState component for loading / empty / error states
- Empty CTA: "No orders yet — Create one"
- Mechanic: own orders only (enforced by API)
- Admin: all orders

---

## Screen 3: Order Detail
File: (app)/orders/[id]/index.tsx

- Fetch full order on mount via GET /api/v1/orders/:id
- Header: vehicle plate or description + back button
- Top-right: Edit button → /orders/[id]/edit
  - Mechanic: visible on own orders only
  - Admin: visible on all orders
- Status row: current StatusBadge + "Change" button → StatusPicker bottom sheet
  - Free choice, any status, any role
- Sections (read-only):
  - Vehicle: plate/description, make, model, year
  - Client: name, phone, email
  - Deadline: formatted date — red if overdue
  - Parts table: name | qty | unit price | row total
  - Services table: description | type | hours × rate or fixed amount | row total
  - Parts subtotal
  - Services subtotal
  - Grand total (prominent, larger font)
- ListState for loading and error

---

## Screen 4: Create Order
File: (app)/orders/new.tsx

Uses OrderForm component in mode="create"

Sections:
1. Vehicle & Client
   - Vehicle: SearchInput → existing vehicle dropdown
     - On select: auto-fill client field from vehicle.clientId (overridable)
   - Client: SearchInput → existing client dropdown, defaults to Unknown
   - No inline expand — new vehicle/client via modal on submit

2. Deadline
   - DateTimeField component (native or web fallback)
   - Required field

3. Parts
   - PartRow components: part name (SearchInput) | qty | unit price | row total
   - "+ Add part" button
   - Parts subtotal (calculated)

4. Services
   - ServiceRow components: description | Hourly/Fixed toggle | hours | rate | total
   - Hourly: total is read-only calculated field (hours × rate)
   - Fixed: hours + rate dimmed; total is directly editable
   - "+ Add service" button
   - Services subtotal (calculated)

5. Grand total display (calculated)

Submit: "Create Order"
- If vehicle text doesn't match existing → New Vehicle modal (ConfirmDialog pattern)
- If client text doesn't match existing → New Client modal (after vehicle modal closes)
- On success: navigate to /orders/[newId]

New Vehicle Modal fields:
  License plate (optional), Description (optional, pre-filled from typed value),
  Make (optional), Model (optional), Year (optional), VIN (optional),
  Client search (defaults to Unknown)
  Validation: plate OR description required

New Client Modal fields:
  Name (required, pre-filled), Phone (optional), Email (optional), Notes (optional)

---

## Screen 5: Edit Order
File: (app)/orders/[id]/edit.tsx

Uses OrderForm component in mode="edit"
Fetch full order on mount, pre-fill all fields

Differences from Create:
- Vehicle & Client: read-only for mechanic, editable for admin
- Deadline: read-only for mechanic, editable for admin
- Parts + Services: editable by all roles
- Submit label: "Save Changes"
- Parts/services sent as full replacement arrays — no partial merge
- On success: navigate back to /orders/[id], show Toast "Order updated"

---

## Screen 6: Parts List
File: (app)/catalog/parts/index.tsx

- SearchInput at top (debounced 300ms, min 2 chars)
- FlatList: part name | added by | date added
- Pull-to-refresh, infinite scroll, ListState
- "+ Add part" button (top-right) → PartModal bottom sheet (create mode)
  - Name input (required), unique validation
  - Submit: "Add to catalog" — available immediately globally
- Row actions (admin only) via overflow (⋯) button:
  - Edit → /catalog/parts/[id]/edit
  - Delete → ConfirmDialog warning about historical impact, then DELETE request

---

## Screen 7: Edit Part
File: (app)/catalog/parts/[id]/edit.tsx
Admin only — redirect mechanic back to parts list

- Single input: Part name (pre-filled)
- Warning message: "Renaming this part updates all historical orders"
- Read-only meta: added by + date
- Save button → PATCH request
- On success: navigate back, show Toast "Part updated"

---

## Screen 8: Clients List
File: (app)/catalog/clients/index.tsx

- SearchInput at top (by client name)
- FlatList: name | phone | email | order count
- Pull-to-refresh, infinite scroll, ListState
- "+ Add client" button → ClientModal bottom sheet (create mode)
  - Fields: Name (required), Phone, Email, Notes
- Row actions (admin only) via overflow (⋯) button:
  - Edit → /catalog/clients/[id]/edit
  - Delete → ConfirmDialog, then DELETE request

---

## Screen 9: Edit Client
File: (app)/catalog/clients/[id]/edit.tsx
Admin only — redirect mechanic back to clients list

- Pre-filled fields: Name, Phone, Email, Notes
- Save button → PATCH request
- On success: navigate back, show Toast "Client updated"

---

## Screen 10: Vehicles List
File: (app)/catalog/vehicles/index.tsx

- SearchInput at top (by plate or description)
- FlatList: plate or description | client name | make + model
- Pull-to-refresh, infinite scroll, ListState
- "+ Add vehicle" button → VehicleModal bottom sheet (create mode)
  - Fields: License plate, Description, Make, Model, Year, VIN, Client search
  - Validation: plate OR description required
- Row actions (admin only) via overflow (⋯) button:
  - Edit / Reassign → /catalog/vehicles/[id]/edit
  - Delete → ConfirmDialog, then DELETE request

---

## Screen 11: Edit Vehicle
File: (app)/catalog/vehicles/[id]/edit.tsx
Admin only — redirect mechanic back to vehicles list

- Pre-filled fields: License plate, Description, Make, Model, Year, VIN
- Client reassignment: SearchInput for client (shows current, fully replaceable)
  - Can reassign to any client or Unknown
- Save button → PATCH request
- On success: navigate back, show Toast "Vehicle updated"

---

## Profile Tab
File: (app)/profile/index.tsx
Not a stack screen — inline content within the tab

- User name (large)
- Role badge: "Mechanic" or "Admin"
- Email (secondary text)
- Logout button (bottom, destructive style)
  - ConfirmDialog: "Are you sure you want to log out?"
  - On confirm: clear SecureStore token, redirect to /login

---

## Shared Components Location

src/components/
├── orders/
│   ├── OrderCard.tsx
│   ├── OrderForm.tsx
│   ├── StatusPicker.tsx       ← bottom sheet, free status choice
│   ├── PartRow.tsx
│   └── ServiceRow.tsx
├── catalog/
│   ├── PartModal.tsx          ← add part bottom sheet
│   ├── ClientModal.tsx        ← add client bottom sheet
│   └── VehicleModal.tsx       ← add vehicle bottom sheet
└── ui/
    ├── SearchInput.tsx        ← debounced, min 2 chars
    ├── StatusBadge.tsx
    ├── ConfirmDialog.tsx      ← native alert + web modal fallback
    ├── DateTimeField.tsx      ← native picker + web input fallback
    ├── ListState.tsx          ← loading / empty / error states
    └── Toast.tsx
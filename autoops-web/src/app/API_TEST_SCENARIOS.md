## Task: API Test Suite

### Setup
- Test runner: Jest + ts-jest
- HTTP client: native fetch (Node 18+)
- Location: src/__tests__/api/
- Config: jest.config.ts at project root
- Run with: npm run test:api
- Base URL: process.env.TEST_API_URL (default: http://localhost:3000)
- All tests run sequentially — state carries between tests via shared context object

### Shared Test Context
Declare a mutable context object at the top of each test file:
{
  adminToken: string
  mechanicToken: string
  mechanic2Token: string
  pendingToken: string
  orderId: string
  clientId: string
  vehicleId: string
  partId: string
}
Populate it during setup tests — reuse across all subsequent tests.

---

## Test File: auth.test.ts

### AUTH-01 — Login with valid admin credentials
POST /api/v1/auth/login
Body: { email: "admin@autoops.com", password: "admin123" }
Expect:
- status 200
- data.token is a non-empty string
- data.user.role === "admin"
- data.user.email === "admin@autoops.com"
- data.user does NOT contain password_hash
Action: store data.token as context.adminToken

### AUTH-02 — Login with valid mechanic credentials
POST /api/v1/auth/login
Body: { email: "mechanic@autoops.com", password: "mechanic123" }
Expect:
- status 200
- data.user.role === "mechanic"
Action: store data.token as context.mechanicToken

### AUTH-03 — Login with second mechanic
POST /api/v1/auth/login
Body: { email: "mechanic2@autoops.com", password: "mechanic123" }
Expect: status 200
Action: store data.token as context.mechanic2Token

### AUTH-04 — Login with pending account
POST /api/v1/auth/login
Body: { email: "pending@autoops.com", password: "pending123" }
Expect:
- status 403
- error.code === "ACCOUNT_NOT_ACTIVE"

### AUTH-05 — Login with wrong password
POST /api/v1/auth/login
Body: { email: "admin@autoops.com", password: "wrongpassword" }
Expect:
- status 401
- error.code === "INVALID_CREDENTIALS"

### AUTH-06 — Login with unknown email
POST /api/v1/auth/login
Body: { email: "nobody@autoops.com", password: "test123" }
Expect: status 401

### AUTH-07 — Login with missing fields
POST /api/v1/auth/login
Body: { email: "admin@autoops.com" }
Expect: status 400

### AUTH-08 — Access protected route without token
GET /api/v1/orders
No Authorization header
Expect: status 401

### AUTH-09 — Access protected route with malformed token
GET /api/v1/orders
Authorization: Bearer not_a_real_token
Expect: status 401

---

## Test File: catalog.test.ts

All three catalog entities live under `/api/v1/catalog/{parts,clients,vehicles}` and expose GET (list + single), POST, PATCH, and DELETE. PATCH on clients/vehicles is admin-only; PATCH on parts is open. DELETE is admin-only on all three and is rejected (409) when the row is still referenced by an order (or vehicle, for clients).

### CAT-PARTS-01 — Create a part (mechanic)
POST /api/v1/catalog/parts
Auth: mechanicToken
Body: { "name": "Test Brake Pads — Front" }
Expect:
- status 201
- data.id is a valid UUID
- data.name === "Test Brake Pads — Front"
Action: store data.id as context.partId

### CAT-PARTS-02 — Create duplicate part name
POST /api/v1/catalog/parts
Auth: mechanicToken
Body: { "name": "Test Brake Pads — Front" }
Expect: status 409

### CAT-PARTS-03 — Create part with missing name
POST /api/v1/catalog/parts
Auth: mechanicToken
Body: {}
Expect: status 400

### CAT-PARTS-04 — List parts (no filter)
GET /api/v1/catalog/parts
Auth: mechanicToken
Expect:
- status 200
- data is an array
- pagination.pageSize === 20
- at least 1 result

### CAT-PARTS-05 — Search parts by name
GET /api/v1/catalog/parts?search=Brake
Auth: mechanicToken
Expect:
- status 200
- every item in data has name containing "Brake" (case-insensitive)

### CAT-PARTS-06 — Search with less than 2 chars
GET /api/v1/catalog/parts?search=B
Auth: mechanicToken
Expect: status 400

### CAT-PARTS-07 — Create part without auth
POST /api/v1/catalog/parts
No auth
Body: { "name": "Unauthorized Part" }
Expect: status 401

### CAT-PARTS-08 — Get part by id
GET /api/v1/catalog/parts/:partId
Auth: mechanicToken
Expect:
- status 200
- data.id === context.partId

### CAT-PARTS-09 — Rename part (any authenticated user)
PATCH /api/v1/catalog/parts/:partId
Auth: mechanicToken
Body: { "name": "Test Brake Pads — Front (renamed)" }
Expect:
- status 200
- data.name === "Test Brake Pads — Front (renamed)"

### CAT-PARTS-10 — Delete part (mechanic — forbidden)
DELETE /api/v1/catalog/parts/:partId
Auth: mechanicToken
Expect: status 403

---

## Test File: clients.test.ts

### CAT-CLI-01 — Create a client (mechanic)
POST /api/v1/catalog/clients
Auth: mechanicToken
Body: { "name": "Test Suite Client (autoops-test)", "phone": "+359 88 000 0000", "email": "test@client.com", "notes": "Test note" }
Expect:
- status 201
- data.id is UUID
- data.name === "Test Suite Client (autoops-test)"
Action: store data.id as context.clientId

### CAT-CLI-02 — Create client with missing name
POST /api/v1/catalog/clients
Auth: mechanicToken
Body: { "phone": "+359 88 111 1111" }
Expect: status 400

### CAT-CLI-03 — Edit client (admin)
PATCH /api/v1/catalog/clients/:clientId
Auth: adminToken
Body: { "notes": "Updated by admin" }
Expect:
- status 200
- data.notes === "Updated by admin"

### CAT-CLI-04 — Edit client (mechanic — forbidden)
PATCH /api/v1/catalog/clients/:clientId
Auth: mechanicToken
Body: { "notes": "Should not work" }
Expect: status 403

### CAT-CLI-05 — List clients
GET /api/v1/catalog/clients
Auth: mechanicToken
Expect:
- status 200
- data is an array
- pagination.total >= 1

### CAT-CLI-06 — Get client by id
GET /api/v1/catalog/clients/:clientId
Auth: mechanicToken
Expect:
- status 200
- data.id === context.clientId

### CAT-CLI-07 — Delete client (mechanic — forbidden)
DELETE /api/v1/catalog/clients/:clientId
Auth: mechanicToken
Expect: status 403

### CAT-CLI-08 — Delete protected Unknown client (admin — 409)
DELETE /api/v1/catalog/clients/00000000-0000-0000-0000-000000000001
Auth: adminToken
Expect:
- status 409
- error.code === "CLIENT_PROTECTED"

---

## Test File: vehicles.test.ts

### CAT-VEH-01 — Create vehicle with license plate only (mechanic)
POST /api/v1/catalog/vehicles
Auth: mechanicToken
Body: { "licensePlate": "TEST-CB-1234", "clientId": context.clientId }
Expect:
- status 201
- data.licensePlate === "TEST-CB-1234"
Action: store data.id as context.vehicleId

### CAT-VEH-02 — Create vehicle with description only
POST /api/v1/catalog/vehicles
Auth: mechanicToken
Body: { "description": "Test Vehicle — Red Toyota" }
Expect: status 201

### CAT-VEH-03 — Create vehicle with no plate and no description
POST /api/v1/catalog/vehicles
Auth: mechanicToken
Body: { "make": "Toyota", "year": 2019 }
Expect: status 400

### CAT-VEH-04 — Create vehicle with all fields
POST /api/v1/catalog/vehicles
Auth: mechanicToken
Body: { "licensePlate": "TEST-PA-9999", "description": "Test Vehicle — Blue VW", "make": "Volkswagen", "model": "Golf", "year": 2020, "vin": "1HGBH41JXMN109186", "clientId": context.clientId }
Expect: status 201
Action: store data.id as context.deletableVehicleId

### CAT-VEH-05 — Edit vehicle (admin only)
PATCH /api/v1/catalog/vehicles/:vehicleId
Auth: adminToken
Body: { "description": "Test Vehicle — Updated" }
Expect:
- status 200
- data.description === "Test Vehicle — Updated"

### CAT-VEH-06 — Edit vehicle (mechanic — forbidden)
PATCH /api/v1/catalog/vehicles/:vehicleId
Auth: mechanicToken
Body: { "description": "Should fail" }
Expect: status 403

### CAT-VEH-07 — List vehicles
GET /api/v1/catalog/vehicles
Auth: mechanicToken
Expect:
- status 200
- data is an array
- pagination.total >= 2

### CAT-VEH-08 — Get vehicle by id
GET /api/v1/catalog/vehicles/:vehicleId
Auth: mechanicToken
Expect:
- status 200
- data.id === context.vehicleId

### CAT-VEH-09 — Delete vehicle (mechanic — forbidden)
DELETE /api/v1/catalog/vehicles/:deletableVehicleId
Auth: mechanicToken
Expect: status 403

### CAT-VEH-10 — Delete unused vehicle (admin)
DELETE /api/v1/catalog/vehicles/:deletableVehicleId
Auth: adminToken
Expect:
- status 200
- data.id === context.deletableVehicleId

---

## Test File: orders.test.ts

### ORD-01 — Create order (mechanic)
POST /api/v1/orders
Auth: mechanicToken
Body:
{
  "vehicleId": context.vehicleId,
  "clientId": context.clientId,
  "deadline": "<ISO datetime 7 days from now>",
  "parts": [
    { "catalogPartId": context.partId, "qty": 2, "unitPrice": 38.50 }
  ],
  "services": [
    { "description": "Install brake pads", "costType": "hourly", "hours": 1.5, "rate": 45.00 },
    { "description": "Misc fee", "costType": "fixed", "fixedAmount": 25.00 }
  ]
}
Expect:
- status 201
- data.status === "booked"
- data.mechanic.id === mechanic user id
- data.parts has 1 item with total === 77.00
- data.services has 2 items
- data.totals.parts === 77.00
- data.totals.services === 92.50
- data.totals.grand === 169.50
Action: store data.id as context.orderId

### ORD-02 — Create order with no parts and no services
POST /api/v1/orders
Auth: mechanicToken
Body: { "vehicleId": context.vehicleId, "clientId": context.clientId, "deadline": "<future date>" }
Expect: status 400

### ORD-03 — Create order without deadline
POST /api/v1/orders
Auth: mechanicToken
Body: { "vehicleId": context.vehicleId, "clientId": context.clientId, "parts": [...] }
Expect: status 400

### ORD-04 — Create order with invalid vehicleId
POST /api/v1/orders
Auth: mechanicToken
Body: { "vehicleId": "00000000-0000-0000-0000-000000000000", ... }
Expect: status 404

### ORD-05 — Get order detail (owner mechanic)
GET /api/v1/orders/:orderId
Auth: mechanicToken
Expect:
- status 200
- data.id === context.orderId
- data.parts is array with 1 item
- data.services is array with 2 items
- data.totals.grand === 169.50
- response does NOT contain password_hash anywhere

### ORD-06 — Get order detail (different mechanic — forbidden)
GET /api/v1/orders/:orderId
Auth: mechanic2Token
Expect: status 403

### ORD-07 — Get order detail (admin — allowed)
GET /api/v1/orders/:orderId
Auth: adminToken
Expect: status 200

### ORD-08 — List orders (mechanic sees own only)
GET /api/v1/orders
Auth: mechanicToken
Expect:
- status 200
- every item in data has mechanic.id === mechanic user id

### ORD-09 — List orders (admin sees all)
GET /api/v1/orders
Auth: adminToken
Expect:
- status 200
- pagination.total >= 1

### ORD-10 — List orders filtered by status
GET /api/v1/orders?status=booked
Auth: mechanicToken
Expect:
- status 200
- every item in data has status === "booked"

### ORD-11 — List orders with invalid status
GET /api/v1/orders?status=flying
Auth: mechanicToken
Expect: status 400

### ORD-12 — Update order status (owner mechanic)
PATCH /api/v1/orders/:orderId
Auth: mechanicToken
Body: { "status": "in_progress" }
Expect:
- status 200
- data.status === "in_progress"

### ORD-13 — Update order vehicle/client (mechanic — forbidden)
PATCH /api/v1/orders/:orderId
Auth: mechanicToken
Body: { "vehicleId": context.vehicleId }
Expect: status 403

### ORD-14 — Update order vehicle/client (admin — allowed)
PATCH /api/v1/orders/:orderId
Auth: adminToken
Body: { "deadline": "<new future ISO datetime>" }
Expect: status 200

### ORD-15 — Update order parts (replaces entirely)
PATCH /api/v1/orders/:orderId
Auth: mechanicToken
Body: {
  "parts": [
    { "catalogPartId": context.partId, "qty": 1, "unitPrice": 50.00 }
  ]
}
Expect:
- status 200
- data.parts.length === 1
- data.parts[0].total === 50.00
- data.totals.parts === 50.00

### ORD-16 — Reassign order to different mechanic (admin only)
PATCH /api/v1/orders/:orderId
Auth: adminToken
Body: { "mechanicId": "<mechanic2 user id>" }
Expect:
- status 200
- data.mechanic.id === mechanic2 user id

### ORD-17 — Reassign order (mechanic — forbidden)
PATCH /api/v1/orders/:orderId
Auth: mechanicToken
Body: { "mechanicId": "<some user id>" }
Expect: status 403

### ORD-18 — Update order with empty services array (clears services)
PATCH /api/v1/orders/:orderId
Auth: mechanic2Token (current owner after ORD-16)
Body: { "services": [] }
Expect:
- status 200
- data.services.length === 0
- data.totals.services === 0

### ORD-19 — Update order with empty parts array (clears parts, then restores)
PATCH /api/v1/orders/:orderId
Auth: mechanic2Token
Step 1 — clear:
- Body: { "parts": [] }
- Expect: status 200, data.parts.length === 0, data.totals.parts === 0
Step 2 — restore (so CAT-DEL-01 still observes PART_IN_USE):
- Body: { "parts": [ { "catalogPartId": context.partId, "qty": 1, "unitPrice": 50.00 } ] }
- Expect: status 200, data.parts.length === 1

### ORD-20 — Create order with hourly service missing hours
POST /api/v1/orders
Auth: mechanicToken
Body:
{
  "vehicleId": context.vehicleId,
  "clientId": context.clientId,
  "deadline": "<future ISO>",
  "services": [ { "description": "No hours", "costType": "hourly", "rate": 45.00 } ]
}
Expect:
- status 400
- error.code === "INVALID_SERVICE"

### ORD-21 — Create order with fixed service missing fixedAmount
POST /api/v1/orders
Auth: mechanicToken
Body:
{
  "vehicleId": context.vehicleId,
  "clientId": context.clientId,
  "deadline": "<future ISO>",
  "services": [ { "description": "No amount", "costType": "fixed" } ]
}
Expect:
- status 400
- error.code === "INVALID_SERVICE"

---

## Test File: users.test.ts

### USR-01 — List users (admin)
GET /api/v1/users
Auth: adminToken
Expect:
- status 200
- data is array
- no item contains password_hash
- all items have id, name, email, role, status, createdAt

### USR-02 — List users (mechanic — forbidden)
GET /api/v1/users
Auth: mechanicToken
Expect: status 403

### USR-03 — List users filtered by status
GET /api/v1/users?status=pending
Auth: adminToken
Expect:
- status 200
- every item has status === "pending"

---

---

## Test File: catalog-delete.test.ts

Runs LAST in the sequencer (after orders.test.ts) — verifies that admin DELETE is rejected with 409 while the row is still referenced.

### CAT-DEL-01 — Delete part referenced by an order (admin → 409)
DELETE /api/v1/catalog/parts/:partId
Auth: adminToken
Expect:
- status 409
- error.code === "PART_IN_USE"

### CAT-DEL-02 — Delete vehicle referenced by an order (admin → 409)
DELETE /api/v1/catalog/vehicles/:vehicleId
Auth: adminToken
Expect:
- status 409
- error.code === "VEHICLE_IN_USE"

### CAT-DEL-03 — Delete client with vehicles/orders (admin → 409)
DELETE /api/v1/catalog/clients/:clientId
Auth: adminToken
Expect:
- status 409
- error.code === "CLIENT_IN_USE"

---

## Expected PASS Report Format

Agent prints this summary after all tests complete:

AUTOOPS API TEST REPORT
=========================
AUTH          9/9    PASS
CATALOG-PARTS 10/10  PASS
CLIENTS       8/8    PASS
VEHICLES      10/10  PASS
ORDERS        21/21  PASS
USERS         3/3    PASS
DELETE-IN-USE 3/3    PASS
-------------------------
TOTAL         64/64  PASS
Duration: Xs

If any test fails, agent prints:
FAIL [TEST-ID] — expected <X> got <Y>
and lists all failures before the summary.

---

## Seed Requirements
Before running tests, seed script must insert:
- 1 admin account: admin@autoops.com / admin123
- 1 active mechanic: mechanic@autoops.com / mechanic123
- 1 second active mechanic: mechanic2@autoops.com / mechanic123
- 1 pending mechanic: pending@autoops.com / pending123
- Unknown client record (fixed seed)
- At least 1 sample part in catalog

Run seed before tests: npm run db:seed:test
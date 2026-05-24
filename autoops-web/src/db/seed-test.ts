/**
 * Seed test fixtures for the API integration suite.
 *
 * Idempotent: safe to run repeatedly. Wipes any test-owned data created by a
 * previous run before re-inserting the canonical fixtures.
 */
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { sql, inArray, or } from 'drizzle-orm';
import { hash } from 'bcryptjs';
import {
  clients,
  users,
  parts_catalog,
  vehicles,
  orders,
  order_parts,
  order_services,
  app_settings,
} from './schema';

const UNKNOWN_CLIENT_ID = '00000000-0000-0000-0000-000000000001';

const TEST_USERS = [
  { name: 'API Admin',     email: 'admin@autoops.com',     password: 'admin123',    role: 'admin' as const,    status: 'active' as const },
  { name: 'API Mechanic',  email: 'mechanic@autoops.com',  password: 'mechanic123', role: 'mechanic' as const, status: 'active' as const },
  { name: 'API Mechanic2', email: 'mechanic2@autoops.com', password: 'mechanic123', role: 'mechanic' as const, status: 'active' as const },
  { name: 'API Pending',   email: 'pending@autoops.com',   password: 'pending123',  role: 'mechanic' as const, status: 'pending' as const },
];

const TEST_USER_EMAILS = TEST_USERS.map((u) => u.email);

// Vehicle license plates / descriptions used by VEH-01..VEH-04 — wiped on re-seed.
const TEST_VEHICLE_PLATES = ['CB 1234 AB', 'PA 9999 ZZ'];
const TEST_VEHICLE_DESCRIPTIONS = ['The red Toyota', 'Blue VW', 'Updated description'];

// Catalog parts created by CAT-01 — wiped on re-seed so CAT-02 (duplicate) is meaningful.
const TEST_PART_NAMES = ['Test Brake Pads — Front'];

// Clients created by CLI-01 — wiped on re-seed.
const TEST_CLIENT_NAMES = ['Test Client'];

async function seed() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required');
  }
  const neonClient = neon(process.env.DATABASE_URL);
  const db = drizzle(neonClient);

  // Ensure Unknown client exists for vehicles without an explicit clientId.
  await db
    .insert(clients)
    .values({ id: UNKNOWN_CLIENT_ID, name: 'Unknown' })
    .onConflictDoNothing();

  // Look up existing test users so we can scope deletes by mechanic_id.
  const existingTestUsers = await db
    .select({ id: users.id, email: users.email })
    .from(users)
    .where(inArray(users.email, TEST_USER_EMAILS));
  const testUserIds = existingTestUsers.map((u) => u.id);

  // Wipe test-owned orders and their child rows before re-seeding.
  if (testUserIds.length > 0) {
    const testOrders = await db
      .select({ id: orders.id })
      .from(orders)
      .where(inArray(orders.mechanic_id, testUserIds));
    const testOrderIds = testOrders.map((o) => o.id);
    if (testOrderIds.length > 0) {
      await db.delete(order_parts).where(inArray(order_parts.order_id, testOrderIds));
      await db.delete(order_services).where(inArray(order_services.order_id, testOrderIds));
      await db.delete(orders).where(inArray(orders.id, testOrderIds));
    }
  }

  // Wipe test vehicles by plate or description.
  await db
    .delete(vehicles)
    .where(
      or(
        inArray(vehicles.license_plate, TEST_VEHICLE_PLATES),
        inArray(vehicles.description, TEST_VEHICLE_DESCRIPTIONS),
      ),
    );

  // Wipe test clients (these were inserted with explicit name 'Test Client').
  await db.delete(clients).where(inArray(clients.name, TEST_CLIENT_NAMES));

  // Wipe test parts.
  await db.delete(parts_catalog).where(inArray(parts_catalog.name, TEST_PART_NAMES));

  // Upsert the four test user accounts. Keys (emails) are stable so IDs persist.
  const upserted = await db
    .insert(users)
    .values(
      await Promise.all(
        TEST_USERS.map(async (u) => ({
          name: u.name,
          email: u.email,
          password_hash: await hash(u.password, 10),
          role: u.role,
          status: u.status,
        })),
      ),
    )
    .onConflictDoUpdate({
      target: users.email,
      set: {
        name: sql`excluded.name`,
        password_hash: sql`excluded.password_hash`,
        role: sql`excluded.role`,
        status: sql`excluded.status`,
      },
    })
    .returning({ id: users.id, email: users.email });

  const adminId = upserted.find((u) => u.email === 'admin@autoops.com')!.id;

  // Ensure app_settings rows exist so admin-only flows work (some routes touch them).
  await db
    .insert(app_settings)
    .values([
      { key: 'hourly_rate', value: '30.00', updated_by: adminId },
      { key: 'currency',    value: 'EUR',   updated_by: adminId },
    ])
    .onConflictDoNothing();

  // Ensure at least one sample part exists in the catalog (separate from test parts).
  await db
    .insert(parts_catalog)
    .values({ name: 'Sample Part — API Suite', created_by: adminId })
    .onConflictDoNothing();

  console.log(`Seeded ${upserted.length} test users + fixtures.`);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});

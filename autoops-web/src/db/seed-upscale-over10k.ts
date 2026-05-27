/**
 * Upscale seed — ensures the DB has more than 10 000 orders.
 *
 * All generated orders:
 *   - created_at within 2019-01-01 … 2021-12-31
 *   - status = 'done'
 *   - completed_at ≤ deadline  (always on time)
 *   - assigned to a real mechanic, real client + vehicle
 *   - at least 1 part  (guarantees a parts line)
 *   - at least 1 service  (guarantees total_amount > 0)
 */
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { ne, sql } from 'drizzle-orm';
import { faker } from '@faker-js/faker';
import {
  users, vehicles, orders, order_parts, order_services, parts_catalog,
} from './schema';

const TARGET_TOTAL  = 10_500;   // comfortable margin above 10 000
const UNKNOWN_CLIENT_ID = '00000000-0000-0000-0000-000000000001';
const BATCH_SIZE    = 500;

const RANGE_START = new Date('2019-01-01T00:00:00Z');
const RANGE_END   = new Date('2021-12-31T23:59:59Z');

const SERVICE_DESCRIPTIONS = [
  'Oil & filter change', 'Brake pad replacement', 'Tire rotation', 'Wheel alignment',
  'Battery replacement', 'Air filter replacement', 'Coolant flush', 'Transmission service',
  'Spark plug replacement', 'Cabin filter replacement', 'Fuel system cleaning',
  'AC recharge', 'Wiper blade replacement', 'Timing belt replacement',
  'Brake fluid flush', 'Power steering flush', 'Differential service', 'Engine diagnostic',
  'Suspension inspection', 'Exhaust repair', 'Clutch replacement', 'Radiator flush',
];

function addDays(d: Date, days: number): Date {
  return new Date(d.getTime() + days * 86_400_000);
}

function randomBetween(a: Date, b: Date): Date {
  return new Date(a.getTime() + Math.random() * (b.getTime() - a.getTime()));
}

async function seedUpscaleOver10k() {
  const neonClient = neon(process.env.DATABASE_URL!);
  const db = drizzle(neonClient);

  // ── count existing orders ──────────────────────────────────────────────────
  const [countRow] = await db.select({ count: sql<string>`COUNT(*)` }).from(orders);
  const current = parseInt(countRow.count, 10);
  const needed  = TARGET_TOTAL - current;

  if (needed <= 0) {
    console.log(`DB already has ${current} orders (≥ ${TARGET_TOTAL}) — nothing to do.`);
    return;
  }
  console.log(`Current orders: ${current}.  Generating ${needed} more to reach ${TARGET_TOTAL}.`);

  // ── fetch mechanics (everyone except TestAdmin) ────────────────────────────
  const mechanicRows = await db
    .select({ id: users.id })
    .from(users)
    .where(ne(users.email, 'testadmin@autoops.internal'));
  if (mechanicRows.length === 0) throw new Error('No mechanics found — run seed.ts first');

  // ── build client → vehicles[] map (exclude Unknown client) ─────────────────
  const vehicleRows = await db
    .select({ clientId: vehicles.client_id, vehicleId: vehicles.id })
    .from(vehicles)
    .where(ne(vehicles.client_id, UNKNOWN_CLIENT_ID));

  const clientVehicleMap = new Map<string, string[]>();
  for (const { clientId, vehicleId } of vehicleRows) {
    if (!clientVehicleMap.has(clientId)) clientVehicleMap.set(clientId, []);
    clientVehicleMap.get(clientId)!.push(vehicleId);
  }
  const eligibleClients = Array.from(clientVehicleMap.keys());
  if (eligibleClients.length === 0) throw new Error('No clients with vehicles found — run seed.ts first');

  // ── fetch catalog parts ────────────────────────────────────────────────────
  const catalogParts = await db.select({ id: parts_catalog.id }).from(parts_catalog);
  if (catalogParts.length === 0) throw new Error('No catalog parts found — run seed.ts first');
  const catalogIds = catalogParts.map(p => p.id);

  // ── build order rows ───────────────────────────────────────────────────────
  type OrderRow = typeof orders.$inferInsert;
  const orderRows: OrderRow[] = [];

  for (let i = 0; i < needed; i++) {
    const createdAt  = randomBetween(RANGE_START, RANGE_END);
    const deadline   = addDays(createdAt, faker.number.int({ min: 2, max: 14 }));
    // completed_at always within [createdAt+1 day, deadline] — never overdue
    const completedAt = randomBetween(addDays(createdAt, 1), deadline);

    const clientId  = faker.helpers.arrayElement(eligibleClients);
    const vehicleId = faker.helpers.arrayElement(clientVehicleMap.get(clientId)!);
    const mechanicId = faker.helpers.arrayElement(mechanicRows).id;

    orderRows.push({
      mechanic_id:  mechanicId,
      client_id:    clientId,
      vehicle_id:   vehicleId,
      status:       'done',
      deadline,
      completed_at: completedAt,
      created_at:   createdAt,
      updated_at:   completedAt,
    });
  }

  // ── insert orders in batches, collect IDs ──────────────────────────────────
  const insertedIds: string[] = [];
  for (let i = 0; i < orderRows.length; i += BATCH_SIZE) {
    const batch = orderRows.slice(i, i + BATCH_SIZE);
    const returned = await db.insert(orders).values(batch).returning({ id: orders.id });
    for (const r of returned) insertedIds.push(r.id);
    process.stdout.write(
      `\rInserting orders...   ${Math.min(i + BATCH_SIZE, orderRows.length).toString().padStart(6)} / ${orderRows.length}`,
    );
  }
  console.log('');

  // ── build parts & services rows ────────────────────────────────────────────
  type OrderPartRow    = typeof order_parts.$inferInsert;
  type OrderServiceRow = typeof order_services.$inferInsert;

  const partRows:    OrderPartRow[]    = [];
  const serviceRows: OrderServiceRow[] = [];

  for (const orderId of insertedIds) {
    // 1–3 parts per order (minimum 1 guarantees a parts line)
    const numParts = faker.number.int({ min: 1, max: 3 });
    for (const catalogPartId of faker.helpers.arrayElements(catalogIds, numParts)) {
      partRows.push({
        order_id:        orderId,
        catalog_part_id: catalogPartId,
        qty:             String(faker.number.float({ min: 1,  max: 4,   fractionDigits: 2 })),
        unit_price:      String(faker.number.float({ min: 5,  max: 300, fractionDigits: 2 })),
      });
    }

    // 1–3 services per order (guarantees total_amount > 0)
    const numServices = faker.number.int({ min: 1, max: 3 });
    for (const description of faker.helpers.arrayElements(SERVICE_DESCRIPTIONS, numServices)) {
      const isHourly = Math.random() < 0.6;
      serviceRows.push(
        isHourly
          ? {
              order_id:     orderId,
              description,
              cost_type:    'hourly' as const,
              hours:        String(faker.number.float({ min: 0.5, max: 8,   fractionDigits: 2 })),
              rate:         String(faker.number.float({ min: 40,  max: 120, fractionDigits: 2 })),
              fixed_amount: null,
            }
          : {
              order_id:     orderId,
              description,
              cost_type:    'fixed' as const,
              hours:        null,
              rate:         null,
              fixed_amount: String(faker.number.float({ min: 20, max: 500, fractionDigits: 2 })),
            },
      );
    }
  }

  // ── insert parts in batches ────────────────────────────────────────────────
  for (let i = 0; i < partRows.length; i += BATCH_SIZE) {
    await db.insert(order_parts).values(partRows.slice(i, i + BATCH_SIZE));
    process.stdout.write(
      `\rInserting parts...    ${Math.min(i + BATCH_SIZE, partRows.length).toString().padStart(6)} / ${partRows.length}   `,
    );
  }
  console.log('');

  // ── insert services in batches ─────────────────────────────────────────────
  for (let i = 0; i < serviceRows.length; i += BATCH_SIZE) {
    await db.insert(order_services).values(serviceRows.slice(i, i + BATCH_SIZE));
    process.stdout.write(
      `\rInserting services... ${Math.min(i + BATCH_SIZE, serviceRows.length).toString().padStart(6)} / ${serviceRows.length}   `,
    );
  }
  console.log('');

  console.log(
    `Done. Inserted ${insertedIds.length} orders | ` +
    `${partRows.length} parts | ${serviceRows.length} services\n` +
    `DB total orders: ${TARGET_TOTAL}+`,
  );
}

seedUpscaleOver10k().catch(err => { console.error(err); process.exit(1); });

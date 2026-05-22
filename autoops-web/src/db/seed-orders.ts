import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { ne } from 'drizzle-orm';
import { faker } from '@faker-js/faker';
import { users, vehicles, orders, order_parts, order_services, parts_catalog } from './schema';

const UNKNOWN_CLIENT_ID = '00000000-0000-0000-0000-000000000001';
const BATCH_SIZE = 500;

function addDays(d: Date, days: number): Date {
  return new Date(d.getTime() + days * 86_400_000);
}

function randomBetween(a: Date, b: Date): Date {
  return new Date(a.getTime() + Math.random() * (b.getTime() - a.getTime()));
}

type OrderStatus = 'booked' | 'in_progress' | 'awaiting' | 'payment' | 'done';

const SERVICE_DESCRIPTIONS = [
  'Oil & filter change', 'Brake pad replacement', 'Tire rotation', 'Wheel alignment',
  'Battery replacement', 'Air filter replacement', 'Coolant flush', 'Transmission service',
  'Spark plug replacement', 'Cabin filter replacement', 'Fuel system cleaning',
  'AC recharge', 'Wiper blade replacement', 'Timing belt replacement',
  'Brake fluid flush', 'Power steering flush', 'Differential service', 'Engine diagnostic',
  'Suspension inspection', 'Exhaust repair', 'Clutch replacement', 'Radiator flush',
];

async function seedOrders() {
  const neonClient = neon(process.env.DATABASE_URL!);
  const db = drizzle(neonClient);

  // All users except TestAdmin are mechanics
  const mechanicRows = await db
    .select({ id: users.id })
    .from(users)
    .where(ne(users.email, 'testadmin@autoops.internal'));

  if (mechanicRows.length === 0) throw new Error('No mechanics found — run seed.ts first');

  // Build client → vehicles[] map, excluding Unknown client
  const vehicleRows = await db
    .select({ clientId: vehicles.client_id, vehicleId: vehicles.id })
    .from(vehicles)
    .where(ne(vehicles.client_id, UNKNOWN_CLIENT_ID));

  const clientVehicleMap = new Map<string, string[]>();
  for (const { clientId, vehicleId } of vehicleRows) {
    if (!clientVehicleMap.has(clientId)) clientVehicleMap.set(clientId, []);
    clientVehicleMap.get(clientId)!.push(vehicleId);
  }
  const eligibleClients = [...clientVehicleMap.keys()];
  if (eligibleClients.length === 0) throw new Error('No clients with vehicles found');

  // Fetch all catalog parts
  const catalogParts = await db.select({ id: parts_catalog.id }).from(parts_catalog);
  if (catalogParts.length === 0) throw new Error('No catalog parts found — run seed.ts first');
  const catalogIds = catalogParts.map(p => p.id);

  const now = new Date();
  const twoMonthsAgo = addDays(now, -60);
  const tenYearsAgo = new Date(now.getFullYear() - 10, now.getMonth(), now.getDate());

  type OrderRow = {
    mechanic_id: string;
    client_id: string;
    vehicle_id: string;
    status: OrderStatus;
    deadline: Date;
    completed_at: Date | null;
    created_at: Date;
    updated_at: Date;
  };

  const orderRows: OrderRow[] = [];

  let weekStart = tenYearsAgo;
  while (weekStart < now) {
    const weekEnd = new Date(Math.min(addDays(weekStart, 7).getTime(), now.getTime()));

    for (const { id: mechanicId } of mechanicRows) {
      const count = faker.number.int({ min: 2, max: 4 }); // avg 3

      for (let i = 0; i < count; i++) {
        const createdAt = randomBetween(weekStart, weekEnd);
        const deadline = addDays(createdAt, faker.number.int({ min: 2, max: 14 }));
        const clientId = faker.helpers.arrayElement(eligibleClients);
        const vehicleId = faker.helpers.arrayElement(clientVehicleMap.get(clientId)!);

        let status: OrderStatus;
        let completedAt: Date | null = null;
        let updatedAt: Date;

        const isOld = createdAt < twoMonthsAgo;

        if (isOld) {
          // All orders older than 2 months must be closed
          status = 'done';
          const onTime = Math.random() < 0.78;
          completedAt = onTime
            ? randomBetween(addDays(createdAt, 1), deadline)
            : addDays(deadline, faker.number.int({ min: 1, max: 5 }));
          updatedAt = completedAt;
        } else if (deadline < now) {
          // Recent but deadline passed — mostly done
          if (Math.random() < 0.75) {
            status = 'done';
            const onTime = Math.random() < 0.78;
            completedAt = onTime
              ? randomBetween(addDays(createdAt, 1), deadline)
              : addDays(deadline, faker.number.int({ min: 1, max: 3 }));
            updatedAt = completedAt;
          } else {
            status = faker.helpers.arrayElement<OrderStatus>(['payment', 'awaiting']);
            updatedAt = randomBetween(createdAt, now);
          }
        } else {
          // Recent, deadline still in future — open order
          status = faker.helpers.arrayElement<OrderStatus>(['booked', 'in_progress', 'awaiting']);
          updatedAt = randomBetween(createdAt, now);
        }

        orderRows.push({ mechanic_id: mechanicId, client_id: clientId, vehicle_id: vehicleId,
          status, deadline, completed_at: completedAt, created_at: createdAt, updated_at: updatedAt });
      }
    }

    weekStart = addDays(weekStart, 7);
  }

  // Insert orders in batches, collecting inserted IDs
  const insertedIds: string[] = [];
  for (let i = 0; i < orderRows.length; i += BATCH_SIZE) {
    const batch = orderRows.slice(i, i + BATCH_SIZE) as typeof orders.$inferInsert[];
    const returned = await db.insert(orders).values(batch).returning({ id: orders.id });
    for (const r of returned) insertedIds.push(r.id);
    process.stdout.write(`\rInserting orders... ${Math.min(i + BATCH_SIZE, orderRows.length)} / ${orderRows.length}`);
  }

  // Build order_parts rows
  type OrderPartRow = typeof order_parts.$inferInsert;
  type OrderServiceRow = typeof order_services.$inferInsert;

  const partRows: OrderPartRow[] = [];
  const serviceRows: OrderServiceRow[] = [];

  for (const orderId of insertedIds) {
    // 0–3 parts per order (skew toward 1–2)
    const numParts = faker.number.int({ min: 0, max: 3 });
    const usedParts = faker.helpers.arrayElements(catalogIds, numParts);
    for (const catalogPartId of usedParts) {
      partRows.push({
        order_id: orderId,
        catalog_part_id: catalogPartId,
        qty: String(faker.number.float({ min: 1, max: 4, fractionDigits: 2 })),
        unit_price: String(faker.number.float({ min: 5, max: 300, fractionDigits: 2 })),
      });
    }

    // 1–3 services per order
    const numServices = faker.number.int({ min: 1, max: 3 });
    const usedDescriptions = faker.helpers.arrayElements(SERVICE_DESCRIPTIONS, numServices);
    for (const description of usedDescriptions) {
      const isHourly = Math.random() < 0.6;
      if (isHourly) {
        serviceRows.push({
          order_id: orderId,
          description,
          cost_type: 'hourly',
          hours: String(faker.number.float({ min: 0.5, max: 8, fractionDigits: 2 })),
          rate: String(faker.number.float({ min: 40, max: 120, fractionDigits: 2 })),
          fixed_amount: null,
        });
      } else {
        serviceRows.push({
          order_id: orderId,
          description,
          cost_type: 'fixed',
          hours: null,
          rate: null,
          fixed_amount: String(faker.number.float({ min: 20, max: 500, fractionDigits: 2 })),
        });
      }
    }
  }

  // Insert order_parts in batches
  for (let i = 0; i < partRows.length; i += BATCH_SIZE) {
    await db.insert(order_parts).values(partRows.slice(i, i + BATCH_SIZE));
    process.stdout.write(`\rInserting parts...    ${Math.min(i + BATCH_SIZE, partRows.length)} / ${partRows.length}   `);
  }

  // Insert order_services in batches
  for (let i = 0; i < serviceRows.length; i += BATCH_SIZE) {
    await db.insert(order_services).values(serviceRows.slice(i, i + BATCH_SIZE));
    process.stdout.write(`\rInserting services... ${Math.min(i + BATCH_SIZE, serviceRows.length)} / ${serviceRows.length}   `);
  }

  const done = orderRows.filter(o => o.status === 'done');
  const onTime = done.filter(o => o.completed_at! <= o.deadline);
  console.log(`\nInserted ${orderRows.length} orders | ${partRows.length} parts | ${serviceRows.length} services`);
  console.log(`Done: ${done.length} | On time: ${onTime.length} (${Math.round(onTime.length / done.length * 100)}%)`);
}

seedOrders().catch(err => { console.error(err); process.exit(1); });

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { ne } from 'drizzle-orm';
import { faker } from '@faker-js/faker';
import { users, vehicles, orders } from './schema';

const UNKNOWN_CLIENT_ID = '00000000-0000-0000-0000-000000000001';
const BATCH_SIZE = 500;

function addDays(d: Date, days: number): Date {
  return new Date(d.getTime() + days * 86_400_000);
}

function randomBetween(a: Date, b: Date): Date {
  return new Date(a.getTime() + Math.random() * (b.getTime() - a.getTime()));
}

type OrderStatus = 'booked' | 'in_progress' | 'awaiting' | 'payment' | 'done';

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

  // Insert in batches
  for (let i = 0; i < orderRows.length; i += BATCH_SIZE) {
    await db.insert(orders).values(orderRows.slice(i, i + BATCH_SIZE) as typeof orders.$inferInsert[]);
    process.stdout.write(`\rInserting... ${Math.min(i + BATCH_SIZE, orderRows.length)} / ${orderRows.length}`);
  }

  const done = orderRows.filter(o => o.status === 'done');
  const onTime = done.filter(o => o.completed_at! <= o.deadline);
  console.log(`\nInserted ${orderRows.length} orders across ${mechanicRows.length} mechanics`);
  console.log(`Done: ${done.length} | On time: ${onTime.length} (${Math.round(onTime.length / done.length * 100)}%)`);
}

seedOrders().catch(err => { console.error(err); process.exit(1); });

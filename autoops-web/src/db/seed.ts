import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { clients, users, app_settings } from './schema';

// Fixed UUIDs — stable across environments
export const UNKNOWN_CLIENT_ID = '00000000-0000-0000-0000-000000000001';
// Seed admin satisfies the app_settings FK; replace password_hash before production
const SEED_ADMIN_ID = '00000000-0000-0000-0000-000000000002';

async function seed() {
  const sql = neon(process.env.DATABASE_URL!);
  const db = drizzle(sql);

  await db
    .insert(clients)
    .values({ id: UNKNOWN_CLIENT_ID, name: 'Unknown' })
    .onConflictDoNothing();

  await db
    .insert(users)
    .values({
      id: SEED_ADMIN_ID,
      name: 'Seed Admin',
      email: 'seed-admin@autoops.internal',
      password_hash: 'CHANGE_BEFORE_PRODUCTION',
      role: 'admin',
      status: 'inactive',
    })
    .onConflictDoNothing();

  await db
    .insert(app_settings)
    .values({
      key: 'hourly_rate',
      value: '0.00',
      updated_by: SEED_ADMIN_ID,
    })
    .onConflictDoNothing();

  console.log('Seed complete.');
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});

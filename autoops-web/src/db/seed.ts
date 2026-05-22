import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { sql } from 'drizzle-orm';
import { hash } from 'bcryptjs';
import { clients, users, app_settings, parts_catalog } from './schema';

export const UNKNOWN_CLIENT_ID = '00000000-0000-0000-0000-000000000001';

const REAL_USERS = [
  { name: 'Steve',     email: 'steve@gmail.com',                       password: 'pass123', role: 'admin'    as const },
  { name: 'Peter',     email: 'peter@gmail.com',            password: 'pass123', role: 'mechanic' as const },
  { name: 'Dave',      email: 'dave@gmail.com',             password: 'pass123', role: 'mechanic' as const },
  { name: 'John',      email: 'john@gmail.com',             password: 'pass123', role: 'mechanic' as const },
  { name: 'Nick',      email: 'nick@gmail.com',             password: 'pass123', role: 'mechanic' as const },
  { name: 'TestAdmin', email: 'testadmin@autoops.internal', password: 'test123', role: 'admin'    as const },
];

const PART_NAMES = [
  'Engine Block', 'Cylinder Head', 'Pistons', 'Connecting Rods', 'Crankshaft',
  'Camshaft', 'Timing Chain', 'Timing Chain Kit', 'Timing Belt', 'Timing Belt Kit',
  'Water Pump', 'Oil Pump', 'Spark Plugs', 'Glow Plugs', 'Fuel Injectors',
  'Fuel Pump', 'Fuel Filter', 'Air Filter', 'Intake Manifold', 'Exhaust Manifold',
  'Turbocharger', 'Intercooler', 'EGR Valve', 'Throttle Body', 'Mass Air Flow Sensor',
  'Oxygen Sensor', 'Crankshaft Position Sensor', 'Camshaft Position Sensor',
  'Knock Sensor', 'Oil Pressure Sensor', 'Radiator', 'Thermostat', 'Coolant Reservoir',
  'Radiator Fan', 'Fan Clutch', 'Heater Core', 'Coolant Hoses', 'Gearbox',
  'Clutch Kit', 'Flywheel', 'Dual Mass Flywheel', 'Torque Converter', 'Differential',
  'Driveshaft', 'CV Axle', 'CV Joint', 'Universal Joint', 'Brake Discs', 'Brake Pads',
  'Brake Drums', 'Brake Shoes', 'Brake Caliper', 'Brake Master Cylinder',
  'Brake Booster', 'ABS Sensor', 'Brake Hoses', 'Brake Lines', 'Shock Absorbers',
  'Struts', 'Coil Springs', 'Control Arms', 'Ball Joints', 'Tie Rod Ends',
  'Stabilizer Bar', 'Stabilizer Bar Links', 'Wheel Bearings', 'Hub Assembly',
  'Steering Rack', 'Power Steering Pump', 'Steering Column', 'Battery', 'Alternator',
  'Starter Motor', 'Ignition Coil', 'Ignition Switch', 'Fuse Box', 'Relay',
  'Wiring Harness', 'ECU', 'Catalytic Converter', 'DPF', 'Muffler', 'Exhaust Pipe',
  'Exhaust Gaskets', 'Lambda Sensor', 'Radiator Grille', 'Bumper', 'Hood', 'Fenders',
  'Door Handles', 'Side Mirrors', 'Windshield', 'Windshield Wipers', 'Headlights',
  'Tail Lights', 'Fog Lights', 'Seat Belts', 'Airbags', 'Head Gasket',
  'Valve Cover Gasket', 'Oil Pan Gasket', 'Oil Filter', 'Cabin Air Filter',
  'Engine Oil', 'Gear Oil', 'Coolant', 'Brake Fluid', 'Power Steering Fluid',
  'Transmission Fluid', 'Washer Fluid', 'Grease', 'AdBlue',
];

async function seed() {
  const neonClient = neon(process.env.DATABASE_URL!);
  const db = drizzle(neonClient);

  await db
    .insert(clients)
    .values({ id: UNKNOWN_CLIENT_ID, name: 'Unknown' })
    .onConflictDoNothing();

  const inserted = await db
    .insert(users)
    .values(
      await Promise.all(
        REAL_USERS.map(async (u) => ({
          name: u.name,
          email: u.email,
          password_hash: await hash(u.password, 10),
          role: u.role,
          status: 'active' as const,
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

  const testAdminId = inserted.find((u) => u.email === 'testadmin@autoops.internal')!.id;

  await db
    .insert(app_settings)
    .values({ key: 'hourly_rate', value: '0.00', updated_by: testAdminId })
    .onConflictDoNothing();

  await db
    .insert(parts_catalog)
    .values(PART_NAMES.map((name) => ({ name, created_by: testAdminId })))
    .onConflictDoNothing();

  console.log(`Seeded ${inserted.length} users and ${PART_NAMES.length} parts.`);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});

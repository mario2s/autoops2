import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { clients, users, app_settings, parts_catalog } from './schema';

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

  const partNames = [
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

  await db
    .insert(parts_catalog)
    .values(partNames.map((name) => ({ name, created_by: SEED_ADMIN_ID })))
    .onConflictDoNothing();

  console.log('Seed complete.');
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});

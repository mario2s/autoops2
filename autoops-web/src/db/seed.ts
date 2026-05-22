import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { sql, eq } from 'drizzle-orm';
import { hash } from 'bcryptjs';
import { faker } from '@faker-js/faker';
import { clients, users, app_settings, parts_catalog, vehicles } from './schema';

export const UNKNOWN_CLIENT_ID = '00000000-0000-0000-0000-000000000001';

// Weights for 1–5 vehicles per client: heavy at 1, drops sharply
const VEHICLE_COUNT_WEIGHTS = [60, 22, 10, 5, 3]; // sums to 100

function weightedVehicleCount(): number {
  const rand = Math.random() * 100;
  let cumulative = 0;
  for (let i = 0; i < VEHICLE_COUNT_WEIGHTS.length; i++) {
    cumulative += VEHICLE_COUNT_WEIGHTS[i];
    if (rand < cumulative) return i + 1;
  }
  return 1;
}

const MAKES_MODELS: Record<string, string[]> = {
  Toyota:     ['Corolla', 'Camry', 'Yaris', 'RAV4', 'Land Cruiser'],
  Volkswagen: ['Golf', 'Passat', 'Polo', 'Tiguan', 'Touareg'],
  BMW:        ['3 Series', '5 Series', 'X3', 'X5', '1 Series'],
  Mercedes:   ['C-Class', 'E-Class', 'A-Class', 'GLC', 'Sprinter'],
  Ford:       ['Focus', 'Fiesta', 'Mondeo', 'Kuga', 'Transit'],
  Opel:       ['Astra', 'Corsa', 'Insignia', 'Mokka', 'Zafira'],
  Renault:    ['Clio', 'Megane', 'Kadjar', 'Duster', 'Scenic'],
  Peugeot:    ['208', '308', '3008', '5008', '508'],
  Skoda:      ['Octavia', 'Fabia', 'Superb', 'Karoq', 'Kodiaq'],
  Audi:       ['A3', 'A4', 'A6', 'Q3', 'Q5'],
};

const ALL_MAKES = Object.keys(MAKES_MODELS);

const COLORS = ['Red', 'White', 'Black', 'Silver', 'Blue', 'Grey', 'Green', 'Yellow', 'Brown', 'Orange'];

function randomDescription(make: string, model: string, year: number): string {
  const color = faker.helpers.arrayElement(COLORS);
  const variant = faker.number.int({ min: 0, max: 3 });
  if (variant === 0) return `${color} ${make}`;
  if (variant === 1) return `${color} ${make} ${model}`;
  if (variant === 2) return `${make} ${model}`;
  return `${make} ${model} ${year}`;
}

function randomVehicle(clientId: string) {
  const make = faker.helpers.arrayElement(ALL_MAKES);
  const model = faker.helpers.arrayElement(MAKES_MODELS[make]);
  const year = faker.number.int({ min: 1995, max: 2024 });
  // Always has a plate; ~40% also get a description
  const hasDescription = Math.random() < 0.4;
  return {
    client_id: clientId,
    license_plate: faker.vehicle.vrm().toUpperCase(),
    ...(hasDescription ? { description: randomDescription(make, model, year) } : {}),
    make,
    model,
    year: year as unknown as number,
    vin: faker.vehicle.vin(),
  };
}

const REAL_USERS = [
  { name: 'Steve',     email: 'steve@gmail.com',                       password: 'pass123', role: 'admin'    as const },
  { name: 'Peter',     email: 'peter@gmail.com',                       password: 'pass123', role: 'mechanic' as const },
  { name: 'Dave',      email: 'dave@gmail.com',                        password: 'pass123', role: 'mechanic' as const },
  { name: 'John',      email: 'john@gmail.com',                        password: 'pass123', role: 'mechanic' as const },
  { name: 'Nick',      email: 'nick@gmail.com',                        password: 'pass123', role: 'mechanic' as const },
  { name: 'TestAdmin', email: 'testadmin@autoops.internal',            password: 'test123', role: 'admin'    as const },
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

  // Unknown client
  await db
    .insert(clients)
    .values({ id: UNKNOWN_CLIENT_ID, name: 'Unknown' })
    .onConflictDoNothing();

  // Users
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

  // App settings
  await db
    .insert(app_settings)
    .values([
      { key: 'hourly_rate', value: '30.00', updated_by: testAdminId },
      { key: 'currency',    value: 'EUR',   updated_by: testAdminId },
    ])
    .onConflictDoUpdate({
      target: app_settings.key,
      set: { value: sql`excluded.value`, updated_by: sql`excluded.updated_by` },
    });

  // Parts catalog
  await db
    .insert(parts_catalog)
    .values(PART_NAMES.map((name) => ({ name, created_by: testAdminId })))
    .onConflictDoNothing();

  // 100 real clients with weighted 1–5 vehicles each
  const clientRows = Array.from({ length: 100 }, () => ({
    name: faker.person.fullName(),
    phone: faker.phone.number({ style: 'international' }),
    email: faker.internet.email(),
  }));

  const insertedClients = await db
    .insert(clients)
    .values(clientRows)
    .onConflictDoNothing()
    .returning({ id: clients.id });

  const clientVehicles = insertedClients.flatMap((c) =>
    Array.from({ length: weightedVehicleCount() }, () => randomVehicle(c.id)),
  );

  // Wipe unknown-client vehicles so re-runs don't stack stale rows
  await db.delete(vehicles).where(eq(vehicles.client_id, UNKNOWN_CLIENT_ID));

  // 100 vehicles under Unknown client — always have a description; ~30% also have a plate
  const unknownVehicles = Array.from({ length: 100 }, () => {
    const make = faker.helpers.arrayElement(ALL_MAKES);
    const model = faker.helpers.arrayElement(MAKES_MODELS[make]);
    const year = faker.number.int({ min: 1990, max: 2024 });
    const hasPlate = Math.random() < 0.3;
    return {
      client_id: UNKNOWN_CLIENT_ID,
      description: randomDescription(make, model, year),
      ...(hasPlate ? { license_plate: faker.vehicle.vrm().toUpperCase() } : {}),
      make,
      model,
      year: year as unknown as number,
    };
  });

  await db.insert(vehicles).values([...clientVehicles, ...unknownVehicles]);

  console.log(
    `Seeded ${inserted.length} users, ${insertedClients.length} clients, ` +
    `${clientVehicles.length} client vehicles, ${unknownVehicles.length} unknown vehicles, ` +
    `${PART_NAMES.length} parts.`,
  );
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});

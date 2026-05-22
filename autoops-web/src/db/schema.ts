import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  text,
  smallint,
  decimal,
  timestamp,
  check,
  index,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// ─── Enums ────────────────────────────────────────────────────────────────────

export const userRoleEnum = pgEnum('user_role', ['mechanic', 'admin']);
export const userStatusEnum = pgEnum('user_status', ['pending', 'active', 'inactive']);
export const orderStatusEnum = pgEnum('order_status', ['booked', 'in_progress', 'awaiting', 'payment', 'done']);
export const costTypeEnum = pgEnum('cost_type', ['hourly', 'fixed']);

// ─── users ────────────────────────────────────────────────────────────────────

export const users = pgTable('users', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  name: varchar('name', { length: 100 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password_hash: varchar('password_hash', { length: 255 }).notNull(),
  role: userRoleEnum('role').notNull().default('mechanic'),
  status: userStatusEnum('status').notNull().default('pending'),
  created_at: timestamp('created_at').notNull().default(sql`now()`),
  updated_at: timestamp('updated_at').notNull().default(sql`now()`),
});

// ─── clients ──────────────────────────────────────────────────────────────────

export const clients = pgTable('clients', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  name: varchar('name', { length: 100 }).notNull(),
  phone: varchar('phone', { length: 30 }),
  email: varchar('email', { length: 255 }),
  notes: text('notes'),
  created_at: timestamp('created_at').notNull().default(sql`now()`),
  updated_at: timestamp('updated_at').notNull().default(sql`now()`),
});

// ─── vehicles ─────────────────────────────────────────────────────────────────

export const vehicles = pgTable(
  'vehicles',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    // Default points to the seeded 'Unknown' client; updated at migration time via seed
    client_id: uuid('client_id')
      .notNull()
      .references(() => clients.id),
    license_plate: varchar('license_plate', { length: 20 }),
    description: text('description'),
    make: varchar('make', { length: 50 }),
    model: varchar('model', { length: 50 }),
    year: smallint('year'),
    vin: varchar('vin', { length: 17 }),
    created_at: timestamp('created_at').notNull().default(sql`now()`),
    updated_at: timestamp('updated_at').notNull().default(sql`now()`),
  },
  (t) => [
    check('license_plate_or_description', sql`${t.license_plate} IS NOT NULL OR ${t.description} IS NOT NULL`),
    index('vehicles_client_id_idx').on(t.client_id),
    index('vehicles_license_plate_idx').on(t.license_plate),
  ],
);

// ─── parts_catalog ────────────────────────────────────────────────────────────

export const parts_catalog = pgTable(
  'parts_catalog',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    name: varchar('name', { length: 150 }).notNull().unique(),
    created_by: uuid('created_by')
      .notNull()
      .references(() => users.id),
    created_at: timestamp('created_at').notNull().default(sql`now()`),
    updated_at: timestamp('updated_at').notNull().default(sql`now()`),
  },
  (t) => [
    index('parts_catalog_name_idx').on(t.name),
  ],
);

// ─── orders ───────────────────────────────────────────────────────────────────

export const orders = pgTable(
  'orders',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    mechanic_id: uuid('mechanic_id')
      .notNull()
      .references(() => users.id),
    client_id: uuid('client_id')
      .notNull()
      .references(() => clients.id),
    vehicle_id: uuid('vehicle_id')
      .notNull()
      .references(() => vehicles.id),
    status: orderStatusEnum('status').notNull().default('booked'),
    deadline: timestamp('deadline').notNull(),
    created_at: timestamp('created_at').notNull().default(sql`now()`),
    updated_at: timestamp('updated_at').notNull().default(sql`now()`),
  },
  (t) => [
    index('orders_mechanic_id_idx').on(t.mechanic_id),
    index('orders_status_idx').on(t.status),
    index('orders_deadline_idx').on(t.deadline),
  ],
);

// ─── order_parts ──────────────────────────────────────────────────────────────

export const order_parts = pgTable(
  'order_parts',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    order_id: uuid('order_id')
      .notNull()
      .references(() => orders.id),
    catalog_part_id: uuid('catalog_part_id')
      .notNull()
      .references(() => parts_catalog.id),
    qty: decimal('qty', { precision: 10, scale: 2 }).notNull(),
    unit_price: decimal('unit_price', { precision: 10, scale: 2 }).notNull(),
    created_at: timestamp('created_at').notNull().default(sql`now()`),
  },
  (t) => [
    index('order_parts_order_id_idx').on(t.order_id),
  ],
);

// ─── order_services ───────────────────────────────────────────────────────────

export const order_services = pgTable(
  'order_services',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    order_id: uuid('order_id')
      .notNull()
      .references(() => orders.id),
    description: varchar('description', { length: 255 }).notNull(),
    cost_type: costTypeEnum('cost_type').notNull(),
    hours: decimal('hours', { precision: 10, scale: 2 }),
    rate: decimal('rate', { precision: 10, scale: 2 }),
    fixed_amount: decimal('fixed_amount', { precision: 10, scale: 2 }),
    created_at: timestamp('created_at').notNull().default(sql`now()`),
  },
  (t) => [
    index('order_services_order_id_idx').on(t.order_id),
  ],
);

// ─── app_settings ─────────────────────────────────────────────────────────────

export const app_settings = pgTable('app_settings', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  key: varchar('key', { length: 100 }).notNull().unique(),
  value: varchar('value', { length: 255 }).notNull(),
  updated_by: uuid('updated_by')
    .notNull()
    .references(() => users.id),
  updated_at: timestamp('updated_at').notNull().default(sql`now()`),
});

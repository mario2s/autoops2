import { db } from './index';
import { orders, users, clients, vehicles, parts_catalog, order_parts, order_services } from './schema';
import { eq, and, sql, desc, count, ilike, or } from 'drizzle-orm';

export type OrderStatus = 'booked' | 'in_progress' | 'awaiting' | 'payment' | 'done';

export type OrderRow = {
  id: string;
  status: OrderStatus;
  deadline: Date;
  vehicleDisplay: string;
  clientName: string;
  mechanicName: string;
  total: number;
};

export async function getOrdersPage({
  status,
  page,
  pageSize = 20,
  mechanicId,
}: {
  status: string | null;
  page: number;
  pageSize?: number;
  mechanicId?: string;
}): Promise<{ orders: OrderRow[]; total: number }> {
  const conditions = [];
  if (status && status !== 'all') {
    conditions.push(eq(orders.status, status as OrderStatus));
  }
  if (mechanicId) {
    conditions.push(eq(orders.mechanic_id, mechanicId));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [{ value: total }] = await db
    .select({ value: count() })
    .from(orders)
    .where(where);

  const rows = await db
    .select({
      id: orders.id,
      status: orders.status,
      deadline: orders.deadline,
      vehiclePlate: vehicles.license_plate,
      vehicleDesc: vehicles.description,
      clientName: clients.name,
      mechanicName: users.name,
      total: sql<string>`COALESCE((
        SELECT SUM(op.qty::numeric * op.unit_price::numeric)
        FROM order_parts op WHERE op.order_id = ${orders.id}
      ), 0) + COALESCE((
        SELECT SUM(CASE WHEN os.cost_type = 'hourly'
          THEN os.hours::numeric * os.rate::numeric
          ELSE os.fixed_amount::numeric END)
        FROM order_services os WHERE os.order_id = ${orders.id}
      ), 0)`,
    })
    .from(orders)
    .innerJoin(vehicles, eq(orders.vehicle_id, vehicles.id))
    .innerJoin(clients, eq(orders.client_id, clients.id))
    .innerJoin(users, eq(orders.mechanic_id, users.id))
    .where(where)
    .orderBy(desc(orders.created_at))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  return {
    orders: rows.map((r) => ({
      id: r.id,
      status: r.status as OrderStatus,
      deadline: r.deadline,
      vehicleDisplay: r.vehiclePlate ?? r.vehicleDesc ?? 'Unknown vehicle',
      clientName: r.clientName,
      mechanicName: r.mechanicName,
      total: parseFloat(r.total),
    })),
    total: Number(total),
  };
}

export async function getPartsCatalogPage({
  search,
  page,
  pageSize = 20,
}: {
  search?: string;
  page: number;
  pageSize?: number;
}) {
  const where = search ? ilike(parts_catalog.name, `%${search}%`) : undefined;

  const [{ value: total }] = await db
    .select({ value: count() })
    .from(parts_catalog)
    .where(where);

  const rows = await db
    .select({
      id: parts_catalog.id,
      name: parts_catalog.name,
      createdBy: users.name,
      createdAt: parts_catalog.created_at,
    })
    .from(parts_catalog)
    .innerJoin(users, eq(parts_catalog.created_by, users.id))
    .where(where)
    .orderBy(desc(parts_catalog.created_at))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  return { parts: rows, total: Number(total) };
}

export async function getClientsPage({
  search,
  page,
  pageSize = 20,
}: {
  search?: string;
  page: number;
  pageSize?: number;
}) {
  const where = search ? ilike(clients.name, `%${search}%`) : undefined;

  const [{ value: total }] = await db
    .select({ value: count() })
    .from(clients)
    .where(where);

  const rows = await db
    .select({
      id: clients.id,
      name: clients.name,
      phone: clients.phone,
      email: clients.email,
      orderCount: sql<string>`(
        SELECT COUNT(*)::int FROM orders o WHERE o.client_id = ${clients.id}
      )`,
    })
    .from(clients)
    .where(where)
    .orderBy(clients.name)
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  return {
    clients: rows.map((r) => ({ ...r, orderCount: Number(r.orderCount) })),
    total: Number(total),
  };
}

export type OrderForEdit = {
  id: string;
  vehicleId: string;
  vehicleDisplay: string;
  vehiclePlate: string | null;
  vehicleDescription: string | null;
  clientId: string;
  clientName: string;
  deadline: Date;
  status: OrderStatus;
  mechanicId: string;
  parts: {
    id: string;
    catalogPartId: string;
    name: string;
    qty: number;
    unitPrice: number;
  }[];
  services: {
    id: string;
    description: string;
    costType: 'hourly' | 'fixed';
    hours: number | null;
    rate: number | null;
    fixedAmount: number | null;
  }[];
};

export async function getOrderForEdit(orderId: string): Promise<OrderForEdit | null> {
  const rows = await db
    .select({
      id: orders.id,
      vehicleId: orders.vehicle_id,
      vehiclePlate: vehicles.license_plate,
      vehicleDesc: vehicles.description,
      clientId: orders.client_id,
      clientName: clients.name,
      deadline: orders.deadline,
      status: orders.status,
      mechanicId: orders.mechanic_id,
    })
    .from(orders)
    .innerJoin(vehicles, eq(orders.vehicle_id, vehicles.id))
    .innerJoin(clients, eq(orders.client_id, clients.id))
    .where(eq(orders.id, orderId))
    .limit(1);

  if (rows.length === 0) return null;
  const row = rows[0];

  const parts = await db
    .select({
      id: order_parts.id,
      catalogPartId: order_parts.catalog_part_id,
      name: parts_catalog.name,
      qty: order_parts.qty,
      unitPrice: order_parts.unit_price,
    })
    .from(order_parts)
    .innerJoin(parts_catalog, eq(order_parts.catalog_part_id, parts_catalog.id))
    .where(eq(order_parts.order_id, orderId));

  const services = await db
    .select({
      id: order_services.id,
      description: order_services.description,
      costType: order_services.cost_type,
      hours: order_services.hours,
      rate: order_services.rate,
      fixedAmount: order_services.fixed_amount,
    })
    .from(order_services)
    .where(eq(order_services.order_id, orderId));

  return {
    id: row.id,
    vehicleId: row.vehicleId,
    vehicleDisplay: row.vehiclePlate ?? row.vehicleDesc ?? 'Unknown vehicle',
    vehiclePlate: row.vehiclePlate,
    vehicleDescription: row.vehicleDesc,
    clientId: row.clientId,
    clientName: row.clientName,
    deadline: row.deadline,
    status: row.status as OrderStatus,
    mechanicId: row.mechanicId,
    parts: parts.map((p) => ({
      id: p.id,
      catalogPartId: p.catalogPartId,
      name: p.name,
      qty: parseFloat(p.qty),
      unitPrice: parseFloat(p.unitPrice),
    })),
    services: services.map((s) => ({
      id: s.id,
      description: s.description,
      costType: s.costType as 'hourly' | 'fixed',
      hours: s.hours != null ? parseFloat(s.hours) : null,
      rate: s.rate != null ? parseFloat(s.rate) : null,
      fixedAmount: s.fixedAmount != null ? parseFloat(s.fixedAmount) : null,
    })),
  };
}

export async function getClientById(id: string) {
  const rows = await db
    .select({
      id: clients.id,
      name: clients.name,
      phone: clients.phone,
      email: clients.email,
      notes: clients.notes,
    })
    .from(clients)
    .where(eq(clients.id, id))
    .limit(1);
  return rows[0] ?? null;
}

export async function getVehicleById(id: string) {
  const rows = await db
    .select({
      id: vehicles.id,
      clientId: vehicles.client_id,
      clientName: clients.name,
      licensePlate: vehicles.license_plate,
      description: vehicles.description,
      make: vehicles.make,
      model: vehicles.model,
      year: vehicles.year,
      vin: vehicles.vin,
    })
    .from(vehicles)
    .innerJoin(clients, eq(vehicles.client_id, clients.id))
    .where(eq(vehicles.id, id))
    .limit(1);
  return rows[0] ?? null;
}

export async function getVehiclesPage({
  search,
  page,
  pageSize = 20,
}: {
  search?: string;
  page: number;
  pageSize?: number;
}) {
  const where = search
    ? or(
        ilike(vehicles.license_plate, `%${search}%`),
        ilike(vehicles.description, `%${search}%`),
      )
    : undefined;

  const [{ value: total }] = await db
    .select({ value: count() })
    .from(vehicles)
    .where(where);

  const rows = await db
    .select({
      id: vehicles.id,
      licensePlate: vehicles.license_plate,
      description: vehicles.description,
      make: vehicles.make,
      model: vehicles.model,
      clientName: clients.name,
    })
    .from(vehicles)
    .innerJoin(clients, eq(vehicles.client_id, clients.id))
    .where(where)
    .orderBy(desc(vehicles.created_at))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  return { vehicles: rows, total: Number(total) };
}

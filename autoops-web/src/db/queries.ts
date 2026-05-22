import { db } from './index';
import { orders, users, clients, vehicles, parts_catalog } from './schema';
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

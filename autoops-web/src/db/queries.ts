import { db } from './index';
import { orders, users, clients, vehicles, parts_catalog, order_parts, order_services, app_settings } from './schema';
import { eq, and, sql, desc, count, ilike, or, ne, gte } from 'drizzle-orm';

export type OrderStatus = 'booked' | 'in_progress' | 'awaiting' | 'payment' | 'done';

export type OrderRow = {
  id: string;
  status: OrderStatus;
  deadline: Date;
  vehicleDisplay: string;
  clientName: string;
  mechanicId: string;
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
      mechanicId: orders.mechanic_id,
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
      mechanicId: r.mechanicId,
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
  mechanicName: string;
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
      mechanicName: users.name,
    })
    .from(orders)
    .innerJoin(vehicles, eq(orders.vehicle_id, vehicles.id))
    .innerJoin(clients, eq(orders.client_id, clients.id))
    .innerJoin(users, eq(orders.mechanic_id, users.id))
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
    mechanicName: row.mechanicName,
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

export async function getVehiclesByClientId(clientId: string): Promise<{ id: string; licensePlate: string | null; description: string | null }[]> {
  return db
    .select({
      id: vehicles.id,
      licensePlate: vehicles.license_plate,
      description: vehicles.description,
    })
    .from(vehicles)
    .where(eq(vehicles.client_id, clientId))
    .orderBy(vehicles.license_plate, vehicles.description);
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

export type InsightsTopItem = { name: string; revenue: number };

export type InsightsData = {
  ytdRevenue: number;
  backlogRevenue: number;
  totalOrders: number;
  topClients: InsightsTopItem[];
  topServices: InsightsTopItem[];
  topParts: InsightsTopItem[];
};

export async function getInsightsData(): Promise<InsightsData> {
  const ytdStart = new Date(new Date().getFullYear(), 0, 1);

  const orderTotalExpr = sql<string>`COALESCE((
    SELECT SUM(op.qty::numeric * op.unit_price::numeric)
    FROM order_parts op WHERE op.order_id = ${orders.id}
  ), 0) + COALESCE((
    SELECT SUM(CASE WHEN os.cost_type = 'hourly'
      THEN os.hours::numeric * os.rate::numeric
      ELSE os.fixed_amount::numeric END)
    FROM order_services os WHERE os.order_id = ${orders.id}
  ), 0)`;

  const [ytdRow] = await db
    .select({ total: sql<string>`COALESCE(SUM(${orderTotalExpr}), 0)` })
    .from(orders)
    .where(and(eq(orders.status, 'done'), gte(orders.created_at, ytdStart)));

  const [backlogRow] = await db
    .select({ total: sql<string>`COALESCE(SUM(${orderTotalExpr}), 0)` })
    .from(orders)
    .where(ne(orders.status, 'done'));

  const [totalOrdersRow] = await db
    .select({ count: sql<string>`COUNT(*)` })
    .from(orders);

  const clientRevenue = sql<string>`SUM(${orderTotalExpr})`;
  const topClientsRows = await db
    .select({ name: clients.name, revenue: clientRevenue })
    .from(orders)
    .innerJoin(clients, eq(orders.client_id, clients.id))
    .where(and(eq(orders.status, 'done'), gte(orders.created_at, ytdStart)))
    .groupBy(orders.client_id, clients.name)
    .orderBy(desc(clientRevenue))
    .limit(5);

  const serviceCost = sql<string>`SUM(CASE WHEN ${order_services.cost_type} = 'hourly'
    THEN COALESCE(${order_services.hours}::numeric, 0) * COALESCE(${order_services.rate}::numeric, 0)
    ELSE COALESCE(${order_services.fixed_amount}::numeric, 0) END)`;
  const topServicesRows = await db
    .select({ name: order_services.description, revenue: serviceCost })
    .from(order_services)
    .innerJoin(orders, eq(order_services.order_id, orders.id))
    .where(and(eq(orders.status, 'done'), gte(orders.created_at, ytdStart)))
    .groupBy(order_services.description)
    .orderBy(desc(serviceCost))
    .limit(5);

  const partRevenue = sql<string>`SUM(${order_parts.qty}::numeric * ${order_parts.unit_price}::numeric)`;
  const topPartsRows = await db
    .select({ name: parts_catalog.name, revenue: partRevenue })
    .from(order_parts)
    .innerJoin(orders, eq(order_parts.order_id, orders.id))
    .innerJoin(parts_catalog, eq(order_parts.catalog_part_id, parts_catalog.id))
    .where(and(eq(orders.status, 'done'), gte(orders.created_at, ytdStart)))
    .groupBy(order_parts.catalog_part_id, parts_catalog.name)
    .orderBy(desc(partRevenue))
    .limit(5);

  return {
    ytdRevenue: parseFloat(ytdRow.total),
    backlogRevenue: parseFloat(backlogRow.total),
    totalOrders: parseInt(totalOrdersRow.count, 10),
    topClients: topClientsRows.map((r) => ({ name: r.name, revenue: parseFloat(r.revenue) })),
    topServices: topServicesRows.map((r) => ({ name: r.name, revenue: parseFloat(r.revenue) })),
    topParts: topPartsRows.map((r) => ({ name: r.name, revenue: parseFloat(r.revenue) })),
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

export type MechanicRow = {
  id: string;
  name: string;
  email: string;
  status: 'pending' | 'active' | 'inactive';
  createdAt: string;
  orderCount: number;
};

export async function getMechanicsForAdmin(): Promise<MechanicRow[]> {
  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      status: users.status,
      createdAt: users.created_at,
      orderCount: sql<string>`(SELECT COUNT(*)::int FROM orders o WHERE o.mechanic_id = ${users.id})`,
    })
    .from(users)
    .where(eq(users.role, 'mechanic'))
    .orderBy(
      sql`CASE ${users.status} WHEN 'pending' THEN 0 WHEN 'active' THEN 1 ELSE 2 END`,
      desc(users.created_at),
    );

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    email: r.email,
    status: r.status as 'pending' | 'active' | 'inactive',
    createdAt: r.createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    orderCount: Number(r.orderCount),
  }));
}

export async function getAllMechanics(): Promise<{ id: string; name: string }[]> {
  return db
    .select({ id: users.id, name: users.name })
    .from(users)
    .where(eq(users.status, 'active'))
    .orderBy(users.name);
}

export async function getAppSetting(key: string): Promise<string | null> {
  const rows = await db
    .select({ value: app_settings.value })
    .from(app_settings)
    .where(eq(app_settings.key, key))
    .limit(1);
  return rows[0]?.value ?? null;
}

import { db } from '@/db';
import {
  orders,
  order_parts,
  order_services,
  parts_catalog,
  users,
  clients,
  vehicles,
} from '@/db/schema';
import { and, eq, sql, desc, count } from 'drizzle-orm';
import { ApiError } from './api-error';
import type { OrderStatus } from '@/db/queries';

export type PartInput = { catalogPartId: string; qty: number; unitPrice: number };
export type ServiceInput = {
  description: string;
  costType: 'hourly' | 'fixed';
  hours: number | null;
  rate: number | null;
  fixedAmount: number | null;
};
export type OrderInputParsed = {
  vehicleId: string;
  clientId: string;
  deadline: Date;
  parts: PartInput[];
  services: ServiceInput[];
};

export function parsePartsArray(partsRaw: unknown): PartInput[] {
  if (!Array.isArray(partsRaw)) {
    throw new ApiError(400, 'INVALID_PART', 'parts must be an array');
  }
  return partsRaw.map((p, i) => {
    if (!p || typeof p !== 'object') {
      throw new ApiError(400, 'INVALID_PART', `parts[${i}] is not an object`);
    }
    const part = p as Record<string, unknown>;
    const catalogPartId = typeof part.catalogPartId === 'string' ? part.catalogPartId : '';
    const qty = typeof part.qty === 'number' ? part.qty : NaN;
    const unitPrice = typeof part.unitPrice === 'number' ? part.unitPrice : NaN;
    if (!catalogPartId) throw new ApiError(400, 'INVALID_PART', `parts[${i}].catalogPartId is required`);
    if (!(qty > 0)) throw new ApiError(400, 'INVALID_PART', `parts[${i}].qty must be > 0`);
    if (!(unitPrice >= 0)) throw new ApiError(400, 'INVALID_PART', `parts[${i}].unitPrice must be >= 0`);
    return { catalogPartId, qty, unitPrice };
  });
}

export function parseServicesArray(servicesRaw: unknown): ServiceInput[] {
  if (!Array.isArray(servicesRaw)) {
    throw new ApiError(400, 'INVALID_SERVICE', 'services must be an array');
  }
  return servicesRaw.map((s, i) => {
    if (!s || typeof s !== 'object') {
      throw new ApiError(400, 'INVALID_SERVICE', `services[${i}] is not an object`);
    }
    const svc = s as Record<string, unknown>;
    const description = typeof svc.description === 'string' ? svc.description.trim() : '';
    const costType = svc.costType;
    if (!description) throw new ApiError(400, 'INVALID_SERVICE', `services[${i}].description is required`);
    if (costType !== 'hourly' && costType !== 'fixed') {
      throw new ApiError(400, 'INVALID_SERVICE', `services[${i}].costType must be "hourly" or "fixed"`);
    }
    if (costType === 'hourly') {
      const hours = typeof svc.hours === 'number' ? svc.hours : NaN;
      const rate = typeof svc.rate === 'number' ? svc.rate : NaN;
      if (!(hours > 0)) throw new ApiError(400, 'INVALID_SERVICE', `services[${i}].hours must be > 0`);
      if (!(rate >= 0)) throw new ApiError(400, 'INVALID_SERVICE', `services[${i}].rate must be >= 0`);
      return { description, costType, hours, rate, fixedAmount: null };
    }
    const fixedAmount = typeof svc.fixedAmount === 'number' ? svc.fixedAmount : NaN;
    if (!(fixedAmount >= 0)) {
      throw new ApiError(400, 'INVALID_SERVICE', `services[${i}].fixedAmount must be >= 0`);
    }
    return { description, costType, hours: null, rate: null, fixedAmount };
  });
}

export function parseOrderInput(body: unknown, options: { requireAll: boolean }): OrderInputParsed {
  if (!body || typeof body !== 'object') {
    throw new ApiError(400, 'INVALID_BODY', 'Request body must be a JSON object');
  }
  const b = body as Record<string, unknown>;

  const vehicleId = typeof b.vehicleId === 'string' ? b.vehicleId : '';
  const clientId = typeof b.clientId === 'string' ? b.clientId : '';
  const deadlineRaw = typeof b.deadline === 'string' ? b.deadline : '';

  if (options.requireAll) {
    if (!vehicleId) throw new ApiError(400, 'MISSING_VEHICLE', 'vehicleId is required');
    if (!clientId) throw new ApiError(400, 'MISSING_CLIENT', 'clientId is required');
    if (!deadlineRaw) throw new ApiError(400, 'MISSING_DEADLINE', 'deadline is required');
  }

  let deadline: Date = new Date(0);
  if (deadlineRaw) {
    deadline = new Date(deadlineRaw);
    if (isNaN(deadline.getTime())) {
      throw new ApiError(400, 'INVALID_DEADLINE', 'deadline must be a valid ISO8601 datetime');
    }
  }

  const parts = b.parts !== undefined ? parsePartsArray(b.parts) : [];
  const services = b.services !== undefined ? parseServicesArray(b.services) : [];

  if (options.requireAll && parts.length === 0 && services.length === 0) {
    throw new ApiError(400, 'EMPTY_LINE_ITEMS', 'At least one part or service is required');
  }

  return { vehicleId, clientId, deadline, parts, services };
}

export async function verifyOrderReferences(input: { vehicleId?: string; clientId?: string; parts?: PartInput[] }) {
  if (input.clientId) {
    const [row] = await db.select({ id: clients.id }).from(clients).where(eq(clients.id, input.clientId)).limit(1);
    if (!row) throw new ApiError(400, 'CLIENT_NOT_FOUND', 'clientId does not exist');
  }
  if (input.vehicleId) {
    const [row] = await db.select({ id: vehicles.id }).from(vehicles).where(eq(vehicles.id, input.vehicleId)).limit(1);
    if (!row) throw new ApiError(400, 'VEHICLE_NOT_FOUND', 'vehicleId does not exist');
  }
  if (input.parts) {
    for (const p of input.parts) {
      const [row] = await db
        .select({ id: parts_catalog.id })
        .from(parts_catalog)
        .where(eq(parts_catalog.id, p.catalogPartId))
        .limit(1);
      if (!row) throw new ApiError(400, 'CATALOG_PART_NOT_FOUND', `catalogPartId ${p.catalogPartId} does not exist`);
    }
  }
}

export type ApiOrderDetail = {
  id: string;
  status: OrderStatus;
  deadline: string;
  createdAt: string;
  updatedAt: string;
  mechanic: { id: string; name: string };
  client: { id: string; name: string; phone: string | null; email: string | null };
  vehicle: {
    id: string;
    licensePlate: string | null;
    description: string | null;
    make: string | null;
    model: string | null;
    year: number | null;
    vin: string | null;
  };
  parts: {
    id: string;
    catalogPartId: string;
    name: string;
    qty: number;
    unitPrice: number;
    total: number;
  }[];
  services: {
    id: string;
    description: string;
    costType: 'hourly' | 'fixed';
    hours: number | null;
    rate: number | null;
    fixedAmount: number | null;
    total: number;
  }[];
  totals: { parts: number; services: number; grand: number };
};

export async function fetchOrderDetail(orderId: string): Promise<ApiOrderDetail | null> {
  const rows = await db
    .select({
      id: orders.id,
      status: orders.status,
      deadline: orders.deadline,
      createdAt: orders.created_at,
      updatedAt: orders.updated_at,
      mechanicId: orders.mechanic_id,
      mechanicName: users.name,
      clientId: orders.client_id,
      clientName: clients.name,
      clientPhone: clients.phone,
      clientEmail: clients.email,
      vehicleId: orders.vehicle_id,
      vehiclePlate: vehicles.license_plate,
      vehicleDescription: vehicles.description,
      vehicleMake: vehicles.make,
      vehicleModel: vehicles.model,
      vehicleYear: vehicles.year,
      vehicleVin: vehicles.vin,
    })
    .from(orders)
    .innerJoin(users, eq(orders.mechanic_id, users.id))
    .innerJoin(clients, eq(orders.client_id, clients.id))
    .innerJoin(vehicles, eq(orders.vehicle_id, vehicles.id))
    .where(eq(orders.id, orderId))
    .limit(1);

  if (rows.length === 0) return null;
  const row = rows[0];

  const partsRows = await db
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

  const servicesRows = await db
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

  const parts = partsRows.map((p) => {
    const qty = parseFloat(p.qty);
    const unitPrice = parseFloat(p.unitPrice);
    return {
      id: p.id,
      catalogPartId: p.catalogPartId,
      name: p.name,
      qty,
      unitPrice,
      total: round2(qty * unitPrice),
    };
  });

  const services = servicesRows.map((s) => {
    const hours = s.hours != null ? parseFloat(s.hours) : null;
    const rate = s.rate != null ? parseFloat(s.rate) : null;
    const fixedAmount = s.fixedAmount != null ? parseFloat(s.fixedAmount) : null;
    const total =
      s.costType === 'hourly'
        ? round2((hours ?? 0) * (rate ?? 0))
        : round2(fixedAmount ?? 0);
    return {
      id: s.id,
      description: s.description,
      costType: s.costType as 'hourly' | 'fixed',
      hours,
      rate,
      fixedAmount,
      total,
    };
  });

  const partsTotal = round2(parts.reduce((sum, p) => sum + p.total, 0));
  const servicesTotal = round2(services.reduce((sum, s) => sum + s.total, 0));

  return {
    id: row.id,
    status: row.status as OrderStatus,
    deadline: row.deadline.toISOString(),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    mechanic: { id: row.mechanicId, name: row.mechanicName },
    client: {
      id: row.clientId,
      name: row.clientName,
      phone: row.clientPhone,
      email: row.clientEmail,
    },
    vehicle: {
      id: row.vehicleId,
      licensePlate: row.vehiclePlate,
      description: row.vehicleDescription,
      make: row.vehicleMake,
      model: row.vehicleModel,
      year: row.vehicleYear,
      vin: row.vehicleVin,
    },
    parts,
    services,
    totals: {
      parts: partsTotal,
      services: servicesTotal,
      grand: round2(partsTotal + servicesTotal),
    },
  };
}

export type OrderListItem = {
  id: string;
  status: OrderStatus;
  deadline: string;
  createdAt: string;
  mechanic: { id: string; name: string };
  client: { id: string; name: string };
  vehicle: {
    id: string;
    licensePlate: string | null;
    description: string | null;
    make: string | null;
    model: string | null;
    year: number | null;
  };
  totals: { parts: number; services: number; grand: number };
};

export async function fetchOrdersList({
  status,
  page,
  pageSize,
  mechanicId,
}: {
  status?: OrderStatus;
  page: number;
  pageSize: number;
  mechanicId?: string;
}): Promise<{ items: OrderListItem[]; total: number }> {
  const conditions = [];
  if (status) conditions.push(eq(orders.status, status));
  if (mechanicId) conditions.push(eq(orders.mechanic_id, mechanicId));
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [{ value: total }] = await db
    .select({ value: count() })
    .from(orders)
    .where(where);

  const partsTotalExpr = sql<string>`COALESCE((
    SELECT SUM(op.qty::numeric * op.unit_price::numeric)
    FROM order_parts op WHERE op.order_id = ${orders.id}
  ), 0)`;

  const servicesTotalExpr = sql<string>`COALESCE((
    SELECT SUM(CASE WHEN os.cost_type = 'hourly'
      THEN os.hours::numeric * os.rate::numeric
      ELSE os.fixed_amount::numeric END)
    FROM order_services os WHERE os.order_id = ${orders.id}
  ), 0)`;

  const rows = await db
    .select({
      id: orders.id,
      status: orders.status,
      deadline: orders.deadline,
      createdAt: orders.created_at,
      mechanicId: orders.mechanic_id,
      mechanicName: users.name,
      clientId: orders.client_id,
      clientName: clients.name,
      vehicleId: orders.vehicle_id,
      vehiclePlate: vehicles.license_plate,
      vehicleDescription: vehicles.description,
      vehicleMake: vehicles.make,
      vehicleModel: vehicles.model,
      vehicleYear: vehicles.year,
      partsTotal: partsTotalExpr,
      servicesTotal: servicesTotalExpr,
    })
    .from(orders)
    .innerJoin(users, eq(orders.mechanic_id, users.id))
    .innerJoin(clients, eq(orders.client_id, clients.id))
    .innerJoin(vehicles, eq(orders.vehicle_id, vehicles.id))
    .where(where)
    .orderBy(desc(orders.created_at))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  const items: OrderListItem[] = rows.map((r) => {
    const parts = round2(parseFloat(r.partsTotal));
    const services = round2(parseFloat(r.servicesTotal));
    return {
      id: r.id,
      status: r.status as OrderStatus,
      deadline: r.deadline.toISOString(),
      createdAt: r.createdAt.toISOString(),
      mechanic: { id: r.mechanicId, name: r.mechanicName },
      client: { id: r.clientId, name: r.clientName },
      vehicle: {
        id: r.vehicleId,
        licensePlate: r.vehiclePlate,
        description: r.vehicleDescription,
        make: r.vehicleMake,
        model: r.vehicleModel,
        year: r.vehicleYear,
      },
      totals: { parts, services, grand: round2(parts + services) },
    };
  });

  return { items, total: Number(total) };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

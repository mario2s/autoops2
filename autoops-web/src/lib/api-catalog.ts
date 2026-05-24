import { eq, count, or, ilike } from 'drizzle-orm';
import { db } from '@/db';
import {
  clients,
  vehicles,
  parts_catalog,
  orders,
  order_parts,
} from '@/db/schema';
import { ApiError } from './api-error';

export const UNKNOWN_CLIENT_ID = '00000000-0000-0000-0000-000000000001';

export function parsePaging(searchParams: URLSearchParams) {
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1);
  const pageSizeRaw = parseInt(searchParams.get('pageSize') ?? '20', 10) || 20;
  const pageSize = Math.min(100, Math.max(1, pageSizeRaw));
  return { page, pageSize };
}

export function parseSearch(searchParams: URLSearchParams): string | undefined {
  const raw = (searchParams.get('search') ?? '').trim();
  if (!raw) return undefined;
  if (raw.length < 2) {
    throw new ApiError(400, 'SEARCH_TOO_SHORT', 'search must be at least 2 characters');
  }
  return raw;
}

// ─── Reference checks for DELETE (block if in use) ────────────────────────────

export async function assertPartNotInUse(partId: string) {
  const [{ value }] = await db
    .select({ value: count() })
    .from(order_parts)
    .where(eq(order_parts.catalog_part_id, partId));
  if (Number(value) > 0) {
    throw new ApiError(409, 'PART_IN_USE', 'Part is referenced by one or more orders');
  }
}

export async function assertVehicleNotInUse(vehicleId: string) {
  const [{ value }] = await db
    .select({ value: count() })
    .from(orders)
    .where(eq(orders.vehicle_id, vehicleId));
  if (Number(value) > 0) {
    throw new ApiError(409, 'VEHICLE_IN_USE', 'Vehicle is referenced by one or more orders');
  }
}

export async function assertClientNotInUse(clientId: string) {
  if (clientId === UNKNOWN_CLIENT_ID) {
    throw new ApiError(409, 'CLIENT_PROTECTED', 'The Unknown client cannot be deleted');
  }
  const [{ value: vehicleCount }] = await db
    .select({ value: count() })
    .from(vehicles)
    .where(eq(vehicles.client_id, clientId));
  if (Number(vehicleCount) > 0) {
    throw new ApiError(409, 'CLIENT_IN_USE', 'Client still owns one or more vehicles');
  }
  const [{ value: orderCount }] = await db
    .select({ value: count() })
    .from(orders)
    .where(eq(orders.client_id, clientId));
  if (Number(orderCount) > 0) {
    throw new ApiError(409, 'CLIENT_IN_USE', 'Client is referenced by one or more orders');
  }
}

// ─── Field helpers ────────────────────────────────────────────────────────────

export function readOptionalString(value: unknown, field: string): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== 'string') {
    throw new ApiError(400, 'INVALID_FIELD', `${field} must be a string`);
  }
  const trimmed = value.trim();
  return trimmed || null;
}

export function readOptionalYear(value: unknown): number | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== 'number' || !Number.isInteger(value)) {
    throw new ApiError(400, 'INVALID_YEAR', 'year must be an integer');
  }
  return value;
}

// ─── Search predicates ────────────────────────────────────────────────────────

export function clientsSearchPredicate(term: string) {
  const pattern = `%${term}%`;
  return or(
    ilike(clients.name, pattern),
    ilike(clients.phone, pattern),
    ilike(clients.email, pattern),
  );
}

export function vehiclesSearchPredicate(term: string) {
  const pattern = `%${term}%`;
  return or(
    ilike(vehicles.license_plate, pattern),
    ilike(vehicles.description, pattern),
    ilike(vehicles.make, pattern),
    ilike(vehicles.model, pattern),
    ilike(vehicles.vin, pattern),
  );
}

export function partsSearchPredicate(term: string) {
  return ilike(parts_catalog.name, `%${term}%`);
}

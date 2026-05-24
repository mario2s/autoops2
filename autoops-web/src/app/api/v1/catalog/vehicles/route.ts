import { NextRequest } from 'next/server';
import { count, desc, eq } from 'drizzle-orm';
import { db } from '@/db';
import { vehicles, clients } from '@/db/schema';
import { validateApiRequest } from '@/lib/api-auth';
import { success, paginated, handleError } from '@/lib/api-response';
import { ApiError } from '@/lib/api-error';
import {
  parsePaging,
  parseSearch,
  vehiclesSearchPredicate,
  readOptionalString,
  readOptionalYear,
  UNKNOWN_CLIENT_ID,
} from '@/lib/api-catalog';

function serialize(row: {
  id: string;
  clientId: string;
  licensePlate: string | null;
  description: string | null;
  make: string | null;
  model: string | null;
  year: number | null;
  vin: string | null;
  createdAt: Date;
  updatedAt?: Date;
}) {
  return {
    id: row.id,
    clientId: row.clientId,
    licensePlate: row.licensePlate,
    description: row.description,
    make: row.make,
    model: row.model,
    year: row.year,
    vin: row.vin,
    createdAt: row.createdAt.toISOString(),
    ...(row.updatedAt ? { updatedAt: row.updatedAt.toISOString() } : {}),
  };
}

export async function GET(request: NextRequest) {
  try {
    await validateApiRequest(request);
    const { searchParams } = request.nextUrl;

    const term = parseSearch(searchParams);
    const where = term ? vehiclesSearchPredicate(term) : undefined;
    const { page, pageSize } = parsePaging(searchParams);

    const [{ value: total }] = await db
      .select({ value: count() })
      .from(vehicles)
      .where(where);

    const rows = await db
      .select({
        id: vehicles.id,
        clientId: vehicles.client_id,
        licensePlate: vehicles.license_plate,
        description: vehicles.description,
        make: vehicles.make,
        model: vehicles.model,
        year: vehicles.year,
        vin: vehicles.vin,
        createdAt: vehicles.created_at,
      })
      .from(vehicles)
      .where(where)
      .orderBy(desc(vehicles.created_at))
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    return paginated(rows.map(serialize), { page, pageSize, total: Number(total) });
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(request: NextRequest) {
  try {
    await validateApiRequest(request);

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      throw new ApiError(400, 'INVALID_BODY', 'Request body must be a JSON object');
    }
    const b = body as Record<string, unknown>;

    const licensePlate = readOptionalString(b.licensePlate, 'licensePlate') ?? null;
    const description = readOptionalString(b.description, 'description') ?? null;
    if (!licensePlate && !description) {
      throw new ApiError(400, 'MISSING_IDENTIFIER', 'licensePlate or description is required');
    }

    const make = readOptionalString(b.make, 'make') ?? null;
    const model = readOptionalString(b.model, 'model') ?? null;
    const year = readOptionalYear(b.year) ?? null;
    const vin = readOptionalString(b.vin, 'vin') ?? null;

    let clientId: string;
    if (b.clientId === undefined || b.clientId === null) {
      clientId = UNKNOWN_CLIENT_ID;
    } else {
      if (typeof b.clientId !== 'string') {
        throw new ApiError(400, 'INVALID_CLIENT', 'clientId must be a string');
      }
      clientId = b.clientId;
    }

    const [clientRow] = await db
      .select({ id: clients.id })
      .from(clients)
      .where(eq(clients.id, clientId))
      .limit(1);
    if (!clientRow) throw new ApiError(400, 'CLIENT_NOT_FOUND', 'clientId does not exist');

    const [row] = await db
      .insert(vehicles)
      .values({
        client_id: clientId,
        license_plate: licensePlate,
        description,
        make,
        model,
        year,
        vin,
      })
      .returning({
        id: vehicles.id,
        clientId: vehicles.client_id,
        licensePlate: vehicles.license_plate,
        description: vehicles.description,
        make: vehicles.make,
        model: vehicles.model,
        year: vehicles.year,
        vin: vehicles.vin,
        createdAt: vehicles.created_at,
      });

    return success(serialize(row), 201);
  } catch (e) {
    return handleError(e);
  }
}

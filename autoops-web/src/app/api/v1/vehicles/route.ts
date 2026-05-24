import { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { vehicles, clients } from '@/db/schema';
import { validateApiRequest } from '@/lib/api-auth';
import { success, handleError } from '@/lib/api-response';
import { ApiError } from '@/lib/api-error';

const UNKNOWN_CLIENT_ID = '00000000-0000-0000-0000-000000000001';

function readString(value: unknown, field: string): string | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'string') {
    throw new ApiError(400, 'INVALID_FIELD', `${field} must be a string`);
  }
  const trimmed = value.trim();
  return trimmed || null;
}

function readYear(value: unknown): number | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'number' || !Number.isInteger(value)) {
    throw new ApiError(400, 'INVALID_YEAR', 'year must be an integer');
  }
  return value;
}

export async function POST(request: NextRequest) {
  try {
    await validateApiRequest(request);

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      throw new ApiError(400, 'INVALID_BODY', 'Request body must be a JSON object');
    }
    const b = body as Record<string, unknown>;

    const licensePlate = readString(b.licensePlate, 'licensePlate');
    const description = readString(b.description, 'description');
    if (!licensePlate && !description) {
      throw new ApiError(400, 'MISSING_IDENTIFIER', 'licensePlate or description is required');
    }

    const make = readString(b.make, 'make');
    const model = readString(b.model, 'model');
    const year = readYear(b.year);
    const vin = readString(b.vin, 'vin');

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

    const [vehicle] = await db
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

    return success(
      {
        id: vehicle.id,
        clientId: vehicle.clientId,
        licensePlate: vehicle.licensePlate,
        description: vehicle.description,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        vin: vehicle.vin,
        createdAt: vehicle.createdAt.toISOString(),
      },
      201,
    );
  } catch (e) {
    return handleError(e);
  }
}

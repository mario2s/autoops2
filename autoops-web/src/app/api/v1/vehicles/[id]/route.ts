import { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { vehicles, clients } from '@/db/schema';
import { validateApiRequest, requireAdmin } from '@/lib/api-auth';
import { success, handleError } from '@/lib/api-response';
import { ApiError } from '@/lib/api-error';

function readOptionalString(value: unknown, field: string): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== 'string') {
    throw new ApiError(400, 'INVALID_FIELD', `${field} must be a string`);
  }
  const trimmed = value.trim();
  return trimmed || null;
}

function readOptionalYear(value: unknown): number | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== 'number' || !Number.isInteger(value)) {
    throw new ApiError(400, 'INVALID_YEAR', 'year must be an integer');
  }
  return value;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { user } = await validateApiRequest(request);
    requireAdmin(user);
    const { id } = await params;

    const [existing] = await db
      .select({
        licensePlate: vehicles.license_plate,
        description: vehicles.description,
      })
      .from(vehicles)
      .where(eq(vehicles.id, id))
      .limit(1);
    if (!existing) throw new ApiError(404, 'VEHICLE_NOT_FOUND', 'Vehicle not found');

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      throw new ApiError(400, 'INVALID_BODY', 'Request body must be a JSON object');
    }
    const b = body as Record<string, unknown>;

    const updates: Record<string, unknown> = { updated_at: new Date() };

    const licensePlate = readOptionalString(b.licensePlate, 'licensePlate');
    const description = readOptionalString(b.description, 'description');
    if (licensePlate !== undefined) updates.license_plate = licensePlate;
    if (description !== undefined) updates.description = description;

    // Enforce: licensePlate or description must remain present after update.
    const finalPlate = licensePlate !== undefined ? licensePlate : existing.licensePlate;
    const finalDesc = description !== undefined ? description : existing.description;
    if (!finalPlate && !finalDesc) {
      throw new ApiError(400, 'MISSING_IDENTIFIER', 'licensePlate or description must be present');
    }

    const make = readOptionalString(b.make, 'make');
    if (make !== undefined) updates.make = make;
    const model = readOptionalString(b.model, 'model');
    if (model !== undefined) updates.model = model;
    const year = readOptionalYear(b.year);
    if (year !== undefined) updates.year = year;
    const vin = readOptionalString(b.vin, 'vin');
    if (vin !== undefined) updates.vin = vin;

    if (b.clientId !== undefined) {
      if (typeof b.clientId !== 'string' || !b.clientId) {
        throw new ApiError(400, 'INVALID_CLIENT', 'clientId must be a non-empty string');
      }
      const [clientRow] = await db
        .select({ id: clients.id })
        .from(clients)
        .where(eq(clients.id, b.clientId))
        .limit(1);
      if (!clientRow) throw new ApiError(400, 'CLIENT_NOT_FOUND', 'clientId does not exist');
      updates.client_id = b.clientId;
    }

    await db.update(vehicles).set(updates).where(eq(vehicles.id, id));

    const [row] = await db
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
        updatedAt: vehicles.updated_at,
      })
      .from(vehicles)
      .where(eq(vehicles.id, id))
      .limit(1);

    return success({
      id: row.id,
      clientId: row.clientId,
      licensePlate: row.licensePlate,
      description: row.description,
      make: row.make,
      model: row.model,
      year: row.year,
      vin: row.vin,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    });
  } catch (e) {
    return handleError(e);
  }
}

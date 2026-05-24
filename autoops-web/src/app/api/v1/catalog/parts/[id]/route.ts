import { NextRequest } from 'next/server';
import { eq, and, ne } from 'drizzle-orm';
import { db } from '@/db';
import { parts_catalog } from '@/db/schema';
import { validateApiRequest, requireAdmin } from '@/lib/api-auth';
import { success, handleError } from '@/lib/api-response';
import { ApiError } from '@/lib/api-error';
import { assertPartNotInUse } from '@/lib/api-catalog';

async function loadPart(id: string) {
  const [row] = await db
    .select({
      id: parts_catalog.id,
      name: parts_catalog.name,
      createdAt: parts_catalog.created_at,
      updatedAt: parts_catalog.updated_at,
    })
    .from(parts_catalog)
    .where(eq(parts_catalog.id, id))
    .limit(1);
  if (!row) throw new ApiError(404, 'PART_NOT_FOUND', 'Part not found');
  return row;
}

function serialize(row: { id: string; name: string; createdAt: Date; updatedAt: Date }) {
  return {
    id: row.id,
    name: row.name,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await validateApiRequest(request);
    const { id } = await params;
    const row = await loadPart(id);
    return success(serialize(row));
  } catch (e) {
    return handleError(e);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await validateApiRequest(request);
    const { id } = await params;
    await loadPart(id);

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      throw new ApiError(400, 'INVALID_BODY', 'Request body must be a JSON object');
    }
    const b = body as Record<string, unknown>;

    const updates: Record<string, unknown> = { updated_at: new Date() };
    if (b.name !== undefined) {
      if (typeof b.name !== 'string' || !b.name.trim()) {
        throw new ApiError(400, 'INVALID_NAME', 'name must be a non-empty string');
      }
      const name = b.name.trim();
      const [clash] = await db
        .select({ id: parts_catalog.id })
        .from(parts_catalog)
        .where(and(eq(parts_catalog.name, name), ne(parts_catalog.id, id)))
        .limit(1);
      if (clash) throw new ApiError(409, 'NAME_CONFLICT', 'A part with this name already exists');
      updates.name = name;
    }

    await db.update(parts_catalog).set(updates).where(eq(parts_catalog.id, id));
    const row = await loadPart(id);
    return success(serialize(row));
  } catch (e) {
    return handleError(e);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { user } = await validateApiRequest(request);
    requireAdmin(user);
    const { id } = await params;
    await loadPart(id);
    await assertPartNotInUse(id);
    await db.delete(parts_catalog).where(eq(parts_catalog.id, id));
    return success({ id });
  } catch (e) {
    return handleError(e);
  }
}

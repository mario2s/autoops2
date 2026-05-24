import { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { clients } from '@/db/schema';
import { validateApiRequest, requireAdmin } from '@/lib/api-auth';
import { success, handleError } from '@/lib/api-response';
import { ApiError } from '@/lib/api-error';
import { assertClientNotInUse, readOptionalString } from '@/lib/api-catalog';

async function loadClient(id: string) {
  const [row] = await db
    .select({
      id: clients.id,
      name: clients.name,
      phone: clients.phone,
      email: clients.email,
      notes: clients.notes,
      createdAt: clients.created_at,
      updatedAt: clients.updated_at,
    })
    .from(clients)
    .where(eq(clients.id, id))
    .limit(1);
  if (!row) throw new ApiError(404, 'CLIENT_NOT_FOUND', 'Client not found');
  return row;
}

function serialize(row: Awaited<ReturnType<typeof loadClient>>) {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    email: row.email,
    notes: row.notes,
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
    const row = await loadClient(id);
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
    const { user } = await validateApiRequest(request);
    requireAdmin(user);
    const { id } = await params;
    await loadClient(id);

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      throw new ApiError(400, 'INVALID_BODY', 'Request body must be a JSON object');
    }
    const b = body as Record<string, unknown>;

    const updates: Record<string, unknown> = { updated_at: new Date() };

    if (b.name !== undefined) {
      const name = readOptionalString(b.name, 'name');
      if (!name) throw new ApiError(400, 'INVALID_NAME', 'name cannot be empty');
      updates.name = name;
    }
    const phone = readOptionalString(b.phone, 'phone');
    if (phone !== undefined) updates.phone = phone;
    const email = readOptionalString(b.email, 'email');
    if (email !== undefined) updates.email = email;
    const notes = readOptionalString(b.notes, 'notes');
    if (notes !== undefined) updates.notes = notes;

    await db.update(clients).set(updates).where(eq(clients.id, id));
    const row = await loadClient(id);
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
    await loadClient(id);
    await assertClientNotInUse(id);
    await db.delete(clients).where(eq(clients.id, id));
    return success({ id });
  } catch (e) {
    return handleError(e);
  }
}

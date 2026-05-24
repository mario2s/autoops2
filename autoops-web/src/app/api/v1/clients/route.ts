import { NextRequest } from 'next/server';
import { db } from '@/db';
import { clients } from '@/db/schema';
import { validateApiRequest } from '@/lib/api-auth';
import { success, handleError } from '@/lib/api-response';
import { ApiError } from '@/lib/api-error';

function readString(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'string') {
    throw new ApiError(400, 'INVALID_FIELD', 'Field must be a string');
  }
  const trimmed = value.trim();
  return trimmed || null;
}

export async function POST(request: NextRequest) {
  try {
    await validateApiRequest(request);

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      throw new ApiError(400, 'INVALID_BODY', 'Request body must be a JSON object');
    }
    const b = body as Record<string, unknown>;

    const name = readString(b.name);
    if (!name) throw new ApiError(400, 'MISSING_NAME', 'name is required');

    const phone = readString(b.phone);
    const email = readString(b.email);
    const notes = readString(b.notes);

    const [client] = await db
      .insert(clients)
      .values({ name, phone, email, notes })
      .returning({
        id: clients.id,
        name: clients.name,
        phone: clients.phone,
        email: clients.email,
        notes: clients.notes,
        createdAt: clients.created_at,
      });

    return success(
      {
        id: client.id,
        name: client.name,
        phone: client.phone,
        email: client.email,
        notes: client.notes,
        createdAt: client.createdAt.toISOString(),
      },
      201,
    );
  } catch (e) {
    return handleError(e);
  }
}

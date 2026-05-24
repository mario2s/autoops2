import { NextRequest } from 'next/server';
import { count, desc } from 'drizzle-orm';
import { db } from '@/db';
import { clients } from '@/db/schema';
import { validateApiRequest } from '@/lib/api-auth';
import { success, paginated, handleError } from '@/lib/api-response';
import { ApiError } from '@/lib/api-error';
import {
  parsePaging,
  parseSearch,
  clientsSearchPredicate,
  readOptionalString,
} from '@/lib/api-catalog';

function serialize(row: {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt?: Date;
}) {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    email: row.email,
    notes: row.notes,
    createdAt: row.createdAt.toISOString(),
    ...(row.updatedAt ? { updatedAt: row.updatedAt.toISOString() } : {}),
  };
}

export async function GET(request: NextRequest) {
  try {
    await validateApiRequest(request);
    const { searchParams } = request.nextUrl;

    const term = parseSearch(searchParams);
    const where = term ? clientsSearchPredicate(term) : undefined;
    const { page, pageSize } = parsePaging(searchParams);

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
        notes: clients.notes,
        createdAt: clients.created_at,
      })
      .from(clients)
      .where(where)
      .orderBy(desc(clients.created_at))
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

    const name = readOptionalString(b.name, 'name');
    if (!name) throw new ApiError(400, 'MISSING_NAME', 'name is required');

    const phone = readOptionalString(b.phone, 'phone') ?? null;
    const email = readOptionalString(b.email, 'email') ?? null;
    const notes = readOptionalString(b.notes, 'notes') ?? null;

    const [row] = await db
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

    return success(serialize(row), 201);
  } catch (e) {
    return handleError(e);
  }
}

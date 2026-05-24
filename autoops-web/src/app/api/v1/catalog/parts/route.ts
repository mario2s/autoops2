import { NextRequest } from 'next/server';
import { ilike, count, desc, eq } from 'drizzle-orm';
import { db } from '@/db';
import { parts_catalog } from '@/db/schema';
import { validateApiRequest } from '@/lib/api-auth';
import { success, paginated, handleError } from '@/lib/api-response';
import { ApiError } from '@/lib/api-error';

export async function GET(request: NextRequest) {
  try {
    await validateApiRequest(request);
    const { searchParams } = request.nextUrl;

    const searchRaw = (searchParams.get('search') ?? '').trim();
    let where;
    if (searchRaw) {
      if (searchRaw.length < 2) {
        throw new ApiError(400, 'SEARCH_TOO_SHORT', 'search must be at least 2 characters');
      }
      where = ilike(parts_catalog.name, `%${searchRaw}%`);
    }

    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1);
    const pageSizeRaw = parseInt(searchParams.get('pageSize') ?? '20', 10) || 20;
    const pageSize = Math.min(100, Math.max(1, pageSizeRaw));

    const [{ value: total }] = await db
      .select({ value: count() })
      .from(parts_catalog)
      .where(where);

    const rows = await db
      .select({
        id: parts_catalog.id,
        name: parts_catalog.name,
        createdAt: parts_catalog.created_at,
      })
      .from(parts_catalog)
      .where(where)
      .orderBy(desc(parts_catalog.created_at))
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    const data = rows.map((r) => ({
      id: r.id,
      name: r.name,
      createdAt: r.createdAt.toISOString(),
    }));

    return paginated(data, { page, pageSize, total: Number(total) });
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user } = await validateApiRequest(request);

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      throw new ApiError(400, 'INVALID_BODY', 'Request body must be a JSON object');
    }
    const b = body as Record<string, unknown>;
    const name = typeof b.name === 'string' ? b.name.trim() : '';
    if (!name) throw new ApiError(400, 'MISSING_NAME', 'name is required');

    const [existing] = await db
      .select({ id: parts_catalog.id })
      .from(parts_catalog)
      .where(eq(parts_catalog.name, name))
      .limit(1);
    if (existing) {
      throw new ApiError(409, 'NAME_CONFLICT', 'A part with this name already exists');
    }

    const [part] = await db
      .insert(parts_catalog)
      .values({ name, created_by: user.userId })
      .returning({
        id: parts_catalog.id,
        name: parts_catalog.name,
        createdAt: parts_catalog.created_at,
      });

    return success(
      { id: part.id, name: part.name, createdAt: part.createdAt.toISOString() },
      201,
    );
  } catch (e) {
    return handleError(e);
  }
}

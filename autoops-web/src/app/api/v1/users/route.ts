import { NextRequest } from 'next/server';
import { and, eq, desc, count } from 'drizzle-orm';
import { db } from '@/db';
import { users } from '@/db/schema';
import { validateApiRequest, requireAdmin } from '@/lib/api-auth';
import { paginated, handleError } from '@/lib/api-response';
import { ApiError } from '@/lib/api-error';

type UserStatus = 'pending' | 'active' | 'inactive';
const ALLOWED_STATUSES: UserStatus[] = ['pending', 'active', 'inactive'];

export async function GET(request: NextRequest) {
  try {
    const { user } = await validateApiRequest(request);
    requireAdmin(user);

    const { searchParams } = request.nextUrl;
    const statusParam = searchParams.get('status');
    let status: UserStatus | undefined;
    if (statusParam) {
      if (!ALLOWED_STATUSES.includes(statusParam as UserStatus)) {
        throw new ApiError(400, 'INVALID_STATUS', 'Invalid status filter');
      }
      status = statusParam as UserStatus;
    }

    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1);
    const pageSizeRaw = parseInt(searchParams.get('pageSize') ?? '20', 10) || 20;
    const pageSize = Math.min(100, Math.max(1, pageSizeRaw));

    const where = status ? eq(users.status, status) : undefined;

    const [{ value: total }] = await db
      .select({ value: count() })
      .from(users)
      .where(where ? and(where) : undefined);

    const rows = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        status: users.status,
        createdAt: users.created_at,
      })
      .from(users)
      .where(where)
      .orderBy(desc(users.created_at))
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    const data = rows.map((r) => ({
      id: r.id,
      name: r.name,
      email: r.email,
      role: r.role,
      status: r.status,
      createdAt: r.createdAt.toISOString(),
    }));

    return paginated(data, { page, pageSize, total: Number(total) });
  } catch (e) {
    return handleError(e);
  }
}

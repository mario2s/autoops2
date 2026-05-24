import { NextRequest } from 'next/server';
import { db } from '@/db';
import { orders, order_parts, order_services } from '@/db/schema';
import { validateApiRequest } from '@/lib/api-auth';
import { success, paginated, handleError } from '@/lib/api-response';
import { ApiError } from '@/lib/api-error';
import {
  fetchOrdersList,
  fetchOrderDetail,
  parseOrderInput,
  verifyOrderReferences,
} from '@/lib/api-orders';
import type { OrderStatus } from '@/db/queries';

const ALLOWED_STATUSES: OrderStatus[] = ['booked', 'in_progress', 'awaiting', 'payment', 'done'];

export async function GET(request: NextRequest) {
  try {
    const { user } = await validateApiRequest(request);
    const { searchParams } = request.nextUrl;

    const statusParam = searchParams.get('status');
    let status: OrderStatus | undefined;
    if (statusParam) {
      if (!ALLOWED_STATUSES.includes(statusParam as OrderStatus)) {
        throw new ApiError(400, 'INVALID_STATUS', 'Invalid status filter');
      }
      status = statusParam as OrderStatus;
    }

    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1);
    const pageSizeRaw = parseInt(searchParams.get('pageSize') ?? '20', 10) || 20;
    const pageSize = Math.min(100, Math.max(1, pageSizeRaw));

    const { items, total } = await fetchOrdersList({
      status,
      page,
      pageSize,
      mechanicId: user.role === 'mechanic' ? user.userId : undefined,
    });

    return paginated(items, { page, pageSize, total });
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user } = await validateApiRequest(request);
    const body = await request.json().catch(() => null);
    const input = parseOrderInput(body, { requireAll: true });

    await verifyOrderReferences({
      vehicleId: input.vehicleId,
      clientId: input.clientId,
      parts: input.parts,
    });

    const [order] = await db
      .insert(orders)
      .values({
        mechanic_id: user.userId,
        client_id: input.clientId,
        vehicle_id: input.vehicleId,
        status: 'booked',
        deadline: input.deadline,
      })
      .returning({ id: orders.id });

    if (input.parts.length > 0) {
      await db.insert(order_parts).values(
        input.parts.map((p) => ({
          order_id: order.id,
          catalog_part_id: p.catalogPartId,
          qty: String(p.qty),
          unit_price: String(p.unitPrice),
        })),
      );
    }

    if (input.services.length > 0) {
      await db.insert(order_services).values(
        input.services.map((s) => ({
          order_id: order.id,
          description: s.description,
          cost_type: s.costType,
          hours: s.hours != null ? String(s.hours) : null,
          rate: s.rate != null ? String(s.rate) : null,
          fixed_amount: s.fixedAmount != null ? String(s.fixedAmount) : null,
        })),
      );
    }

    const detail = await fetchOrderDetail(order.id);
    return success(detail, 201);
  } catch (e) {
    return handleError(e);
  }
}

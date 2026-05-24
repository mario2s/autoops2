import { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { orders, order_parts, order_services, users } from '@/db/schema';
import { validateApiRequest } from '@/lib/api-auth';
import { success, handleError } from '@/lib/api-response';
import { ApiError } from '@/lib/api-error';
import {
  fetchOrderDetail,
  parsePartsArray,
  parseServicesArray,
  verifyOrderReferences,
  type PartInput,
  type ServiceInput,
} from '@/lib/api-orders';
import type { OrderStatus } from '@/db/queries';

const ALLOWED_STATUSES: OrderStatus[] = ['booked', 'in_progress', 'awaiting', 'payment', 'done'];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { user } = await validateApiRequest(request);
    const { id } = await params;

    const [order] = await db
      .select({ mechanicId: orders.mechanic_id })
      .from(orders)
      .where(eq(orders.id, id))
      .limit(1);

    if (!order) throw new ApiError(404, 'ORDER_NOT_FOUND', 'Order not found');

    if (user.role === 'mechanic' && order.mechanicId !== user.userId) {
      throw new ApiError(403, 'FORBIDDEN', 'You can only access your own orders');
    }

    const detail = await fetchOrderDetail(id);
    return success(detail);
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
    const { id } = await params;

    const [existing] = await db
      .select({ mechanicId: orders.mechanic_id })
      .from(orders)
      .where(eq(orders.id, id))
      .limit(1);

    if (!existing) throw new ApiError(404, 'ORDER_NOT_FOUND', 'Order not found');

    if (user.role === 'mechanic' && existing.mechanicId !== user.userId) {
      throw new ApiError(403, 'FORBIDDEN', 'You can only update your own orders');
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      throw new ApiError(400, 'INVALID_BODY', 'Request body must be a JSON object');
    }
    const b = body as Record<string, unknown>;

    const hasParts = Array.isArray(b.parts);
    const hasServices = Array.isArray(b.services);
    const hasStatus = b.status !== undefined;
    const hasDeadline = b.deadline !== undefined;
    const hasVehicle = b.vehicleId !== undefined;
    const hasClient = b.clientId !== undefined;
    const hasMechanic = b.mechanicId !== undefined;

    if (user.role === 'mechanic') {
      if (hasDeadline || hasVehicle || hasClient || hasMechanic) {
        throw new ApiError(403, 'FORBIDDEN', 'Mechanics can only update status, parts, and services');
      }
    }

    let parts: PartInput[] | undefined;
    let services: ServiceInput[] | undefined;
    if (hasParts) parts = parsePartsArray(b.parts);
    if (hasServices) services = parseServicesArray(b.services);

    let status: OrderStatus | undefined;
    if (hasStatus) {
      if (typeof b.status !== 'string' || !ALLOWED_STATUSES.includes(b.status as OrderStatus)) {
        throw new ApiError(400, 'INVALID_STATUS', 'Invalid status value');
      }
      status = b.status as OrderStatus;
    }

    let deadline: Date | undefined;
    if (hasDeadline) {
      if (typeof b.deadline !== 'string') {
        throw new ApiError(400, 'INVALID_DEADLINE', 'deadline must be an ISO8601 string');
      }
      const d = new Date(b.deadline);
      if (isNaN(d.getTime())) throw new ApiError(400, 'INVALID_DEADLINE', 'Invalid deadline value');
      deadline = d;
    }

    let vehicleId: string | undefined;
    if (hasVehicle) {
      if (typeof b.vehicleId !== 'string' || !b.vehicleId) {
        throw new ApiError(400, 'INVALID_VEHICLE', 'vehicleId must be a non-empty string');
      }
      vehicleId = b.vehicleId;
    }

    let clientId: string | undefined;
    if (hasClient) {
      if (typeof b.clientId !== 'string' || !b.clientId) {
        throw new ApiError(400, 'INVALID_CLIENT', 'clientId must be a non-empty string');
      }
      clientId = b.clientId;
    }

    let mechanicId: string | undefined;
    if (hasMechanic) {
      if (typeof b.mechanicId !== 'string' || !b.mechanicId) {
        throw new ApiError(400, 'INVALID_MECHANIC', 'mechanicId must be a non-empty string');
      }
      const [mech] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.id, b.mechanicId))
        .limit(1);
      if (!mech) throw new ApiError(400, 'MECHANIC_NOT_FOUND', 'mechanicId does not exist');
      mechanicId = b.mechanicId;
    }

    await verifyOrderReferences({ vehicleId, clientId, parts });

    const updateValues: Record<string, unknown> = { updated_at: new Date() };
    if (status) updateValues.status = status;
    if (deadline) updateValues.deadline = deadline;
    if (vehicleId) updateValues.vehicle_id = vehicleId;
    if (clientId) updateValues.client_id = clientId;
    if (mechanicId) updateValues.mechanic_id = mechanicId;

    await db.update(orders).set(updateValues).where(eq(orders.id, id));

    if (parts !== undefined) {
      await db.delete(order_parts).where(eq(order_parts.order_id, id));
      if (parts.length > 0) {
        await db.insert(order_parts).values(
          parts.map((p) => ({
            order_id: id,
            catalog_part_id: p.catalogPartId,
            qty: String(p.qty),
            unit_price: String(p.unitPrice),
          })),
        );
      }
    }

    if (services !== undefined) {
      await db.delete(order_services).where(eq(order_services.order_id, id));
      if (services.length > 0) {
        await db.insert(order_services).values(
          services.map((s) => ({
            order_id: id,
            description: s.description,
            cost_type: s.costType,
            hours: s.hours != null ? String(s.hours) : null,
            rate: s.rate != null ? String(s.rate) : null,
            fixed_amount: s.fixedAmount != null ? String(s.fixedAmount) : null,
          })),
        );
      }
    }

    const detail = await fetchOrderDetail(id);
    return success(detail);
  } catch (e) {
    return handleError(e);
  }
}

'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/db';
import { orders, order_parts, order_services, parts_catalog, clients, vehicles } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getSession } from '@/lib/session';

export type PartInput = {
  catalogPartId: string;
  qty: number;
  unitPrice: number;
};

export type ServiceInput = {
  description: string;
  costType: 'hourly' | 'fixed';
  hours: number | null;
  rate: number | null;
  fixedAmount: number | null;
};

export type OrderInput = {
  vehicleId: string;
  clientId: string;
  deadline: string;
  mechanicId?: string;
  parts: PartInput[];
  services: ServiceInput[];
};

export async function createOrderAction(
  input: OrderInput,
): Promise<{ orderId: string } | { error: string }> {
  const session = await getSession();
  if (!session) return { error: 'Unauthorized' };

  try {
    const [order] = await db
      .insert(orders)
      .values({
        mechanic_id: (session.role === 'admin' && input.mechanicId) ? input.mechanicId : session.userId,
        vehicle_id: input.vehicleId,
        client_id: input.clientId,
        status: 'booked',
        deadline: new Date(input.deadline),
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

    return { orderId: order.id };
  } catch (e) {
    console.error(e);
    return { error: 'Failed to create order' };
  }
}

export async function updateOrderAction(
  orderId: string,
  input: OrderInput,
): Promise<{ success: true } | { error: string }> {
  const session = await getSession();
  if (!session) return { error: 'Unauthorized' };

  try {
    if (session.role === 'admin') {
      await db
        .update(orders)
        .set({
          vehicle_id: input.vehicleId,
          client_id: input.clientId,
          deadline: new Date(input.deadline),
          ...(input.mechanicId ? { mechanic_id: input.mechanicId } : {}),
          updated_at: new Date(),
        })
        .where(eq(orders.id, orderId));
    } else {
      await db
        .update(orders)
        .set({ updated_at: new Date() })
        .where(eq(orders.id, orderId));
    }

    await db.delete(order_parts).where(eq(order_parts.order_id, orderId));
    await db.delete(order_services).where(eq(order_services.order_id, orderId));

    if (input.parts.length > 0) {
      await db.insert(order_parts).values(
        input.parts.map((p) => ({
          order_id: orderId,
          catalog_part_id: p.catalogPartId,
          qty: String(p.qty),
          unit_price: String(p.unitPrice),
        })),
      );
    }

    if (input.services.length > 0) {
      await db.insert(order_services).values(
        input.services.map((s) => ({
          order_id: orderId,
          description: s.description,
          cost_type: s.costType,
          hours: s.hours != null ? String(s.hours) : null,
          rate: s.rate != null ? String(s.rate) : null,
          fixed_amount: s.fixedAmount != null ? String(s.fixedAmount) : null,
        })),
      );
    }

    return { success: true };
  } catch (e) {
    console.error(e);
    return { error: 'Failed to update order' };
  }
}

export async function addCatalogPartAction(
  name: string,
): Promise<{ id: string; name: string } | { error: string }> {
  const session = await getSession();
  if (!session) return { error: 'Unauthorized' };

  try {
    const [part] = await db
      .insert(parts_catalog)
      .values({ name: name.trim(), created_by: session.userId })
      .returning({ id: parts_catalog.id, name: parts_catalog.name });
    return part;
  } catch {
    const existing = await db
      .select({ id: parts_catalog.id, name: parts_catalog.name })
      .from(parts_catalog)
      .where(eq(parts_catalog.name, name.trim()))
      .limit(1);
    if (existing.length > 0) return existing[0];
    return { error: 'Failed to add part to catalog' };
  }
}

export type VehicleData = {
  plate: string;
  description: string;
  make: string;
  model: string;
  year: string;
  vin: string;
  clientId: string;
};

export async function createVehicleAction(
  data: VehicleData,
): Promise<{ id: string } | { error: string }> {
  const session = await getSession();
  if (!session) return { error: 'Unauthorized' };

  if (!data.plate.trim() && !data.description.trim()) {
    return { error: 'License plate or description is required' };
  }

  try {
    const [vehicle] = await db
      .insert(vehicles)
      .values({
        client_id: data.clientId,
        license_plate: data.plate.trim() || null,
        description: data.description.trim() || null,
        make: data.make.trim() || null,
        model: data.model.trim() || null,
        year: data.year ? (parseInt(data.year, 10) as unknown as number) : null,
        vin: data.vin.trim() || null,
      })
      .returning({ id: vehicles.id });
    return vehicle;
  } catch (e) {
    console.error(e);
    return { error: 'Failed to create vehicle' };
  }
}

export async function updateClientAction(
  id: string,
  data: { name: string; phone: string; email: string; notes: string },
): Promise<{ success: true } | { error: string }> {
  const session = await getSession();
  if (!session) return { error: 'Unauthorized' };
  if (session.role !== 'admin') return { error: 'Unauthorized' };
  if (!data.name.trim()) return { error: 'Name is required' };

  try {
    await db
      .update(clients)
      .set({
        name: data.name.trim(),
        phone: data.phone.trim() || null,
        email: data.email.trim() || null,
        notes: data.notes.trim() || null,
        updated_at: new Date(),
      })
      .where(eq(clients.id, id));
    return { success: true };
  } catch (e) {
    console.error(e);
    return { error: 'Failed to update client' };
  }
}

export async function updateVehicleAction(
  id: string,
  data: VehicleData,
): Promise<{ success: true } | { error: string }> {
  const session = await getSession();
  if (!session) return { error: 'Unauthorized' };
  if (session.role !== 'admin') return { error: 'Unauthorized' };

  if (!data.plate.trim() && !data.description.trim()) {
    return { error: 'License plate or description is required' };
  }

  try {
    await db
      .update(vehicles)
      .set({
        client_id: data.clientId,
        license_plate: data.plate.trim() || null,
        description: data.description.trim() || null,
        make: data.make.trim() || null,
        model: data.model.trim() || null,
        year: data.year ? (parseInt(data.year, 10) as unknown as number) : null,
        vin: data.vin.trim() || null,
        updated_at: new Date(),
      })
      .where(eq(vehicles.id, id));
    return { success: true };
  } catch (e) {
    console.error(e);
    return { error: 'Failed to update vehicle' };
  }
}

export async function createClientAction(data: {
  name: string;
  phone: string;
  email: string;
  notes: string;
}): Promise<{ id: string; name: string } | { error: string }> {
  const session = await getSession();
  if (!session) return { error: 'Unauthorized' };

  if (!data.name.trim()) return { error: 'Name is required' };

  try {
    const [client] = await db
      .insert(clients)
      .values({
        name: data.name.trim(),
        phone: data.phone.trim() || null,
        email: data.email.trim() || null,
        notes: data.notes.trim() || null,
      })
      .returning({ id: clients.id, name: clients.name });
    return client;
  } catch (e) {
    console.error(e);
    return { error: 'Failed to create client' };
  }
}

export async function assignVehicleToClientAction(
  vehicleId: string,
  clientId: string,
): Promise<{ success: true } | { error: string }> {
  const session = await getSession();
  if (!session) return { error: 'Unauthorized' };
  if (session.role !== 'admin') return { error: 'Unauthorized' };

  try {
    await db
      .update(vehicles)
      .set({ client_id: clientId, updated_at: new Date() })
      .where(eq(vehicles.id, vehicleId));
    return { success: true };
  } catch (e) {
    console.error(e);
    return { error: 'Failed to assign vehicle' };
  }
}

export async function updateOrderMechanicAction(
  orderId: string,
  mechanicId: string,
): Promise<{ success: true } | { error: string }> {
  const session = await getSession();
  if (!session) return { error: 'Unauthorized' };
  if (session.role !== 'admin') return { error: 'Unauthorized' };

  try {
    await db
      .update(orders)
      .set({ mechanic_id: mechanicId, updated_at: new Date() })
      .where(eq(orders.id, orderId));
    revalidatePath('/dashboard');
    return { success: true };
  } catch (e) {
    console.error(e);
    return { error: 'Failed to update mechanic' };
  }
}

export async function updateOrderStatusAction(
  orderId: string,
  status: string,
): Promise<{ success: true } | { error: string }> {
  const session = await getSession();
  if (!session) return { error: 'Unauthorized' };

  try {
    await db
      .update(orders)
      .set({ status: status as 'booked' | 'in_progress' | 'awaiting' | 'payment' | 'done', updated_at: new Date() })
      .where(eq(orders.id, orderId));
    revalidatePath('/dashboard');
    return { success: true };
  } catch (e) {
    console.error(e);
    return { error: 'Failed to update status' };
  }
}

export async function createCatalogPartAction(
  name: string,
): Promise<{ id: string; name: string } | { error: string }> {
  const session = await getSession();
  if (!session) return { error: 'Unauthorized' };
  if (!name.trim()) return { error: 'Part name is required' };

  try {
    const [part] = await db
      .insert(parts_catalog)
      .values({ name: name.trim(), created_by: session.userId })
      .returning({ id: parts_catalog.id, name: parts_catalog.name });
    return part;
  } catch {
    return { error: 'A part with this name already exists' };
  }
}

export async function updateCatalogPartAction(
  id: string,
  name: string,
): Promise<{ success: true } | { error: string }> {
  const session = await getSession();
  if (!session) return { error: 'Unauthorized' };
  if (session.role !== 'admin') return { error: 'Unauthorized' };
  if (!name.trim()) return { error: 'Part name is required' };

  try {
    await db
      .update(parts_catalog)
      .set({ name: name.trim(), updated_at: new Date() })
      .where(eq(parts_catalog.id, id));
    revalidatePath('/catalog');
    return { success: true };
  } catch {
    return { error: 'A part with this name already exists' };
  }
}

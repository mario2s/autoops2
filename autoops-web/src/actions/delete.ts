'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/db';
import { orders, order_parts, order_services, parts_catalog, clients, vehicles } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getSession } from '@/lib/session';

async function requireAdmin() {
  const session = await getSession();
  if (!session || session.role !== 'admin') throw new Error('Unauthorized');
}

export async function deleteOrderAction(id: string): Promise<{ error?: string }> {
  try {
    await requireAdmin();
    await db.delete(order_parts).where(eq(order_parts.order_id, id));
    await db.delete(order_services).where(eq(order_services.order_id, id));
    await db.delete(orders).where(eq(orders.id, id));
    revalidatePath('/dashboard');
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Failed to delete order' };
  }
}

export async function deleteCatalogPartAction(id: string): Promise<{ error?: string }> {
  try {
    await requireAdmin();
    await db.delete(parts_catalog).where(eq(parts_catalog.id, id));
    revalidatePath('/catalog');
    return {};
  } catch (e) {
    const msg = e instanceof Error ? e.message : '';
    if (msg === 'Unauthorized') return { error: msg };
    return { error: 'Cannot delete a part used in existing orders' };
  }
}

export async function deleteClientAction(id: string): Promise<{ error?: string }> {
  try {
    await requireAdmin();
    await db.delete(clients).where(eq(clients.id, id));
    revalidatePath('/catalog');
    return {};
  } catch (e) {
    const msg = e instanceof Error ? e.message : '';
    if (msg === 'Unauthorized') return { error: msg };
    return { error: 'Cannot delete a client with existing orders or vehicles' };
  }
}

export async function deleteVehicleAction(id: string): Promise<{ error?: string }> {
  try {
    await requireAdmin();
    await db.delete(vehicles).where(eq(vehicles.id, id));
    revalidatePath('/catalog');
    return {};
  } catch (e) {
    const msg = e instanceof Error ? e.message : '';
    if (msg === 'Unauthorized') return { error: msg };
    return { error: 'Cannot delete a vehicle with existing orders' };
  }
}

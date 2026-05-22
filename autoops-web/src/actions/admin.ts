'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/db';
import { users, app_settings } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getSession } from '@/lib/session';

async function requireAdmin() {
  const session = await getSession();
  if (!session || session.role !== 'admin') throw new Error('Unauthorized');
  return session;
}

export async function approveAccount(userId: string): Promise<{ error?: string }> {
  try {
    await requireAdmin();
    await db.update(users).set({ status: 'active', updated_at: new Date() }).where(eq(users.id, userId));
    revalidatePath('/admin');
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Failed' };
  }
}

export async function rejectAccount(userId: string): Promise<{ error?: string }> {
  try {
    await requireAdmin();
    await db.update(users).set({ status: 'inactive', updated_at: new Date() }).where(eq(users.id, userId));
    revalidatePath('/admin');
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Failed' };
  }
}

export async function deactivateAccount(userId: string): Promise<{ error?: string }> {
  try {
    const session = await requireAdmin();
    if (session.userId === userId) return { error: 'Cannot deactivate your own account' };
    await db.update(users).set({ status: 'inactive', updated_at: new Date() }).where(eq(users.id, userId));
    revalidatePath('/admin');
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Failed' };
  }
}

export async function activateAccount(userId: string): Promise<{ error?: string }> {
  try {
    await requireAdmin();
    await db.update(users).set({ status: 'active', updated_at: new Date() }).where(eq(users.id, userId));
    revalidatePath('/admin');
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Failed' };
  }
}

export async function updateHourlyRate(rate: number): Promise<{ error?: string }> {
  try {
    const session = await requireAdmin();
    await db
      .insert(app_settings)
      .values({ key: 'hourly_rate', value: String(rate), updated_by: session.userId })
      .onConflictDoUpdate({
        target: app_settings.key,
        set: { value: String(rate), updated_by: session.userId, updated_at: new Date() },
      });
    revalidatePath('/admin');
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Failed to save rate' };
  }
}

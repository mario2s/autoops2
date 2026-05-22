import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { parts_catalog, clients, vehicles } from '@/db/schema';
import { ilike, or } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const tab = searchParams.get('tab') ?? 'parts';
  const q = (searchParams.get('q') ?? '').trim();

  if (!q) return NextResponse.json({ suggestions: [] });

  const pattern = `%${q}%`;

  if (tab === 'parts') {
    const rows = await db
      .select({ label: parts_catalog.name })
      .from(parts_catalog)
      .where(ilike(parts_catalog.name, pattern))
      .limit(8);
    return NextResponse.json({ suggestions: rows.map((r) => r.label) });
  }

  if (tab === 'clients') {
    const rows = await db
      .select({ label: clients.name })
      .from(clients)
      .where(ilike(clients.name, pattern))
      .limit(8);
    return NextResponse.json({ suggestions: rows.map((r) => r.label) });
  }

  if (tab === 'vehicles') {
    const rows = await db
      .select({ plate: vehicles.license_plate, desc: vehicles.description })
      .from(vehicles)
      .where(or(ilike(vehicles.license_plate, pattern), ilike(vehicles.description, pattern)))
      .limit(8);
    return NextResponse.json({
      suggestions: rows.map((r) => r.plate ?? r.desc ?? '').filter(Boolean),
    });
  }

  return NextResponse.json({ suggestions: [] });
}

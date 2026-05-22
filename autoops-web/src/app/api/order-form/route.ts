import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { parts_catalog, clients, vehicles } from '@/db/schema';
import { and, eq, ilike, or } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const type = searchParams.get('type');
  const q = (searchParams.get('q') ?? '').trim();

  if (!q) return NextResponse.json({ results: [] });
  const pattern = `%${q}%`;

  if (type === 'parts') {
    const rows = await db
      .select({ id: parts_catalog.id, name: parts_catalog.name })
      .from(parts_catalog)
      .where(ilike(parts_catalog.name, pattern))
      .limit(8);
    return NextResponse.json({ results: rows });
  }

  if (type === 'clients') {
    const rows = await db
      .select({ id: clients.id, name: clients.name })
      .from(clients)
      .where(ilike(clients.name, pattern))
      .limit(8);
    return NextResponse.json({ results: rows });
  }

  if (type === 'vehicles') {
    const clientId = searchParams.get('clientId');
    const searchCondition = or(ilike(vehicles.license_plate, pattern), ilike(vehicles.description, pattern))!;
    const where = clientId
      ? and(eq(vehicles.client_id, clientId), searchCondition)
      : searchCondition;
    const rows = await db
      .select({
        id: vehicles.id,
        plate: vehicles.license_plate,
        description: vehicles.description,
        clientId: vehicles.client_id,
        clientName: clients.name,
      })
      .from(vehicles)
      .innerJoin(clients, eq(vehicles.client_id, clients.id))
      .where(where)
      .limit(8);
    return NextResponse.json({ results: rows });
  }

  return NextResponse.json({ results: [] });
}

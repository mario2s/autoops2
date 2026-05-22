import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { db } from '@/db';
import { clients } from '@/db/schema';
import { eq } from 'drizzle-orm';
import CreateVehicleForm from '@/components/catalog/CreateVehicleForm';

export default async function NewVehiclePage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const [unknownClientRow] = await db
    .select({ id: clients.id })
    .from(clients)
    .where(eq(clients.name, 'Unknown'))
    .limit(1);

  return <CreateVehicleForm unknownClientId={unknownClientRow?.id ?? ''} />;
}

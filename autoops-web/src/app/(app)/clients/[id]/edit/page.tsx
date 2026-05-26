import { notFound, redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { getClientById, getVehiclesByClientId } from '@/db/queries';
import { db } from '@/db';
import { clients } from '@/db/schema';
import { eq } from 'drizzle-orm';
import EditClientForm from '@/components/catalog/EditClientForm';

export default async function EditClientPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) redirect('/login');
  if (session.role !== 'admin') redirect('/catalog?tab=clients');

  const { id } = await params;

  const unknownClientRow = await db
    .select({ id: clients.id })
    .from(clients)
    .where(eq(clients.name, 'Unknown'))
    .limit(1);
  const unknownClientId = unknownClientRow[0]?.id ?? '';

  const [client, vehicles, unknownVehicles] = await Promise.all([
    getClientById(id),
    getVehiclesByClientId(id),
    unknownClientId ? getVehiclesByClientId(unknownClientId) : Promise.resolve([]),
  ]);
  if (!client) notFound();

  return (
    <EditClientForm
      id={client.id}
      initialName={client.name}
      initialPhone={client.phone ?? ''}
      initialEmail={client.email ?? ''}
      initialNotes={client.notes ?? ''}
      vehicles={vehicles}
      unknownVehicles={unknownVehicles}
    />
  );
}

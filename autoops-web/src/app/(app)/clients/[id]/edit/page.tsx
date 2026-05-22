import { notFound, redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { getClientById } from '@/db/queries';
import EditClientForm from '@/components/catalog/EditClientForm';

export default async function EditClientPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) redirect('/login');

  const { id } = await params;
  const client = await getClientById(id);
  if (!client) notFound();

  return (
    <EditClientForm
      id={client.id}
      initialName={client.name}
      initialPhone={client.phone ?? ''}
      initialEmail={client.email ?? ''}
      initialNotes={client.notes ?? ''}
    />
  );
}

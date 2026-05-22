import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import CreateClientForm from '@/components/catalog/CreateClientForm';

export default async function NewClientPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  return <CreateClientForm />;
}

import { notFound, redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { db } from '@/db';
import { clients } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getVehicleById } from '@/db/queries';
import EditVehicleForm from '@/components/catalog/EditVehicleForm';

export default async function EditVehiclePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) redirect('/login');

  const { id } = await params;
  const [vehicle, unknownClientRow] = await Promise.all([
    getVehicleById(id),
    db.select({ id: clients.id }).from(clients).where(eq(clients.name, 'Unknown')).limit(1),
  ]);

  if (!vehicle) notFound();

  return (
    <EditVehicleForm
      id={vehicle.id}
      unknownClientId={unknownClientRow[0]?.id ?? ''}
      initialPlate={vehicle.licensePlate ?? ''}
      initialDescription={vehicle.description ?? ''}
      initialMake={vehicle.make ?? ''}
      initialModel={vehicle.model ?? ''}
      initialYear={vehicle.year != null ? String(vehicle.year) : ''}
      initialVin={vehicle.vin ?? ''}
      initialClientId={vehicle.clientId}
      initialClientName={vehicle.clientName}
    />
  );
}

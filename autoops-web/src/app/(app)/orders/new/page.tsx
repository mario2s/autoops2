import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { db } from '@/db';
import { clients, app_settings } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getAllMechanics } from '@/db/queries';
import OrderForm from '@/components/orders/OrderForm';

export default async function NewOrderPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const [unknownClientRow, hourlyRateRow, mechanics] = await Promise.all([
    db.select({ id: clients.id }).from(clients).where(eq(clients.name, 'Unknown')).limit(1),
    db.select({ value: app_settings.value }).from(app_settings).where(eq(app_settings.key, 'hourly_rate')).limit(1),
    getAllMechanics(),
  ]);

  const unknownClientId = unknownClientRow[0]?.id ?? '';
  const hourlyRate = parseFloat(hourlyRateRow[0]?.value ?? '30');

  return (
    <OrderForm
      mode="create"
      session={session}
      hourlyRate={hourlyRate}
      unknownClientId={unknownClientId}
      mechanics={mechanics}
    />
  );
}

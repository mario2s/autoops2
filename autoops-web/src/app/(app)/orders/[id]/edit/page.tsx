import { notFound, redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { db } from '@/db';
import { clients, app_settings } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getOrderForEdit } from '@/db/queries';
import OrderForm from '@/components/orders/OrderForm';

type Props = { params: Promise<{ id: string }> };

export default async function EditOrderPage({ params }: Props) {
  const session = await getSession();
  if (!session) redirect('/login');

  const { id } = await params;

  const [order, unknownClientRow, hourlyRateRow] = await Promise.all([
    getOrderForEdit(id),
    db.select({ id: clients.id }).from(clients).where(eq(clients.name, 'Unknown')).limit(1),
    db.select({ value: app_settings.value }).from(app_settings).where(eq(app_settings.key, 'hourly_rate')).limit(1),
  ]);

  if (!order) notFound();

  const unknownClientId = unknownClientRow[0]?.id ?? '';
  const hourlyRate = parseFloat(hourlyRateRow[0]?.value ?? '30');

  return (
    <OrderForm
      mode="edit"
      session={session}
      hourlyRate={hourlyRate}
      unknownClientId={unknownClientId}
      initialData={order}
      orderId={id}
    />
  );
}

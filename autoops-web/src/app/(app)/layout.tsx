import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import AppNav from '@/components/app-nav';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect('/login');

  return (
    <>
      <AppNav session={session} />
      <main className="flex-1">{children}</main>
    </>
  );
}

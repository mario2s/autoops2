import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSession } from '@/lib/session';

export default async function Home() {
  const session = await getSession();

  if (session?.status === 'active') {
    redirect('/dashboard');
  }

  return (
    <div className="flex flex-col items-center justify-center flex-1 px-6 py-24 text-center">
      <div className="max-w-xl">
        <h1 className="text-4xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-5xl">
          AutoOps
        </h1>
        <p className="mt-5 text-lg text-zinc-500 dark:text-zinc-400 leading-relaxed">
          Car shop operations management — orders, clients, vehicles, and
          business insights in one place.
        </p>

        {!session && (
          <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/login"
              className="inline-flex items-center justify-center px-6 py-3 text-sm font-medium bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 rounded-xl hover:bg-zinc-700 dark:hover:bg-zinc-200 transition-colors"
            >
              Log in
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center justify-center px-6 py-3 text-sm font-medium border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              Create an account
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

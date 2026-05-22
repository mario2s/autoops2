import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import Link from 'next/link';
import './globals.css';
import { getSession } from '@/lib/session';
import { logoutAction } from '@/actions/auth';
import { ThemeProvider } from '@/components/theme-provider';
import { ThemeToggle } from '@/components/theme-toggle';
import MobileMenu from '@/components/mobile-menu';

const geist = Geist({ subsets: ['latin'], variable: '--font-geist-sans' });

export const metadata: Metadata = {
  title: 'AutoOps',
  description: 'Car shop operations management',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  return (
    <html lang="en" className={`${geist.variable} h-full`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 antialiased font-sans">
        <ThemeProvider>
          <header className="sticky top-0 z-40 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-sm border-b border-zinc-200 dark:border-zinc-800">
            <div className="relative mx-auto max-w-6xl px-6 h-16 flex items-center justify-between">
              <Link
                href="/"
                className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 hover:text-zinc-600 dark:hover:text-zinc-400 transition-colors"
              >
                AutoOps
              </Link>

              <div className="flex items-center gap-1">
                <ThemeToggle />

                {/* Desktop nav */}
                <nav className="hidden md:flex items-center gap-1 ml-1">
                  {session ? (
                    <>
                      <span className="text-sm text-zinc-500 dark:text-zinc-400 mr-2 px-2">
                        {session.name}
                      </span>
                      <form action={logoutAction}>
                        <button
                          type="submit"
                          className="px-4 py-2 text-sm text-zinc-600 dark:text-zinc-400 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors"
                        >
                          Log out
                        </button>
                      </form>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/login"
                        className="px-4 py-2 text-sm text-zinc-600 dark:text-zinc-400 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors"
                      >
                        Log in
                      </Link>
                      <Link
                        href="/register"
                        className="px-4 py-2 text-sm font-medium bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 rounded-lg hover:bg-zinc-700 dark:hover:bg-zinc-200 transition-colors"
                      >
                        Register
                      </Link>
                    </>
                  )}
                </nav>

                <MobileMenu session={session} />
              </div>
            </div>
          </header>

          <main className="flex-1 flex flex-col">{children}</main>

          <footer className="border-t border-zinc-200 dark:border-zinc-800">
            <div className="mx-auto max-w-6xl px-6 h-14 flex items-center justify-between">
              <span className="text-xs text-zinc-400 dark:text-zinc-600">AutoOps</span>
              <span className="text-xs text-zinc-400 dark:text-zinc-600">
                &copy; {new Date().getFullYear()}
              </span>
            </div>
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}

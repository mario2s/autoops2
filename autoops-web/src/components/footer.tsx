export default function Footer() {
  return (
    <footer className="border-t border-zinc-200 dark:border-zinc-800">
      <div className="mx-auto max-w-6xl px-6 h-14 flex items-center justify-between">
        <span className="text-xs text-zinc-400 dark:text-zinc-600">AutoOps</span>
        <span className="text-xs text-zinc-400 dark:text-zinc-600">
          &copy; {new Date().getFullYear()}
        </span>
      </div>
    </footer>
  );
}

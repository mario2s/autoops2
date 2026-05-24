export function formatCurrency(n: number): string {
  return `$${(n ?? 0).toFixed(2)}`;
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function isOverdue(iso: string): boolean {
  const d = new Date(iso);
  return !isNaN(d.getTime()) && d.getTime() < Date.now();
}

export function vehicleLabel(v: {
  licensePlate: string | null;
  description: string | null;
  make?: string | null;
  model?: string | null;
}): string {
  const primary = v.licensePlate || v.description;
  if (primary) return primary;
  const mm = [v.make, v.model].filter(Boolean).join(' ');
  return mm || 'Vehicle';
}

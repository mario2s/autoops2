'use client';

import { useState } from 'react';
import { updateHourlyRate } from '@/actions/admin';

export default function HourlyRateForm({ initialRate }: { initialRate: string }) {
  const [value, setValue] = useState(initialRate);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    const rate = parseFloat(value);
    if (isNaN(rate) || rate < 0) {
      setError('Enter a valid rate');
      return;
    }
    setError('');
    setSaved(false);
    setLoading(true);
    try {
      const result = await updateHourlyRate(rate);
      if (result.error) {
        setError(result.error);
      } else {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-5 py-4">
        <div>
          <div className="text-sm font-medium text-zinc-900 dark:text-zinc-50">Universal Hourly Rate</div>
          <div className="text-xs text-zinc-400 dark:text-zinc-500 mt-1 leading-relaxed">
            Default rate pre-filled when adding hourly services to an order.
            <br />
            Mechanics can override it per service row.
          </div>
          {error && <div className="text-xs text-red-500 dark:text-red-400 mt-1.5">{error}</div>}
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <input
            type="number"
            min="0"
            step="0.01"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setSaved(false);
            }}
            className="w-24 text-right bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-zinc-900 dark:text-zinc-50 outline-none focus:ring-2 focus:ring-zinc-300 dark:focus:ring-zinc-600 transition-shadow"
          />
          <span className="text-xs text-zinc-400 dark:text-zinc-500 whitespace-nowrap">€ / hour</span>
          <button
            onClick={handleSave}
            disabled={loading}
            className="text-xs px-3 py-1.5 rounded-md bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 font-medium hover:bg-zinc-700 dark:hover:bg-zinc-200 disabled:opacity-50 transition-colors whitespace-nowrap"
          >
            {saved ? 'Saved ✓' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

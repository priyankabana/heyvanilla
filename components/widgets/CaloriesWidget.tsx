'use client';

import { useEffect, useState } from 'react';
import { Flame, Plus, X } from 'lucide-react';
import { todayISO } from '@/lib/utils/date';
import { WidgetShell } from './WidgetShell';

const KEY = 'heyvanilla_calories';
const GOAL = 2000; // kcal/day

type Store = Record<string, number>;

/** A simple daily calorie (kcal) counter, stored per day in localStorage. Add
 *  intake with quick buttons or a custom amount. */
export function CaloriesWidget() {
  const today = todayISO();
  const [store, setStore] = useState<Store>({});
  const [adding, setAdding] = useState(false);
  const [amount, setAmount] = useState('');

  useEffect(() => {
    try {
      setStore(JSON.parse(localStorage.getItem(KEY) ?? '{}') as Store);
    } catch {
      /* ignore */
    }
  }, []);

  const total = store[today] ?? 0;
  const pct = Math.min(100, Math.round((total / GOAL) * 100));

  function set(next: number) {
    const updated = { ...store, [today]: Math.max(0, next) };
    setStore(updated);
    try {
      localStorage.setItem(KEY, JSON.stringify(updated));
    } catch {
      /* ignore */
    }
  }

  function addAmount() {
    const n = parseInt(amount, 10);
    if (Number.isFinite(n) && n !== 0) set(total + n);
    setAmount('');
    setAdding(false);
  }

  return (
    <WidgetShell icon={<Flame size={16} />} title="Calories" href={undefined}>
      <div className="flex h-full flex-col">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-2xl font-semibold text-text-primary">
              {total} <span className="text-sm font-normal text-text-secondary">/ {GOAL} kcal</span>
            </p>
            <p className="mt-0.5 text-xs text-text-secondary">
              {total >= GOAL ? 'goal reached 🔥' : `${GOAL - total} kcal to go`}
            </p>
          </div>
          <button
            onClick={() => setAdding((v) => !v)}
            aria-label={adding ? 'Close' : 'Add calories'}
            className="press rounded-full border border-border bg-white/30 p-1.5 text-text-secondary transition-colors hover:text-[var(--accent)]"
          >
            {adding ? <X size={14} /> : <Plus size={14} />}
          </button>
        </div>

        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-bg-secondary">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, backgroundColor: 'var(--accent)' }}
          />
        </div>

        {adding ? (
          <div className="mt-3 flex items-center gap-1.5">
            <input
              type="number"
              inputMode="numeric"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addAmount()}
              placeholder="kcal"
              aria-label="Calories"
              autoFocus
              className="min-h-[36px] flex-1 rounded-lg border border-border bg-bg-card px-3 text-sm text-text-primary outline-none placeholder:text-text-secondary/60 focus:border-[var(--accent)]"
            />
            <button
              onClick={addAmount}
              disabled={!amount}
              className="min-h-[36px] rounded-lg bg-[var(--accent)] px-3 text-xs font-medium text-white transition-colors hover:bg-[var(--accent-dark)] disabled:opacity-50"
            >
              Add
            </button>
          </div>
        ) : (
          <div className="mt-3 flex gap-2">
            {[100, 250, 500].map((v) => (
              <button
                key={v}
                onClick={() => set(total + v)}
                className="flex-1 rounded-full border border-border bg-white/30 py-1.5 text-xs text-text-secondary transition-colors hover:text-[var(--accent)]"
              >
                +{v}
              </button>
            ))}
          </div>
        )}
      </div>
    </WidgetShell>
  );
}

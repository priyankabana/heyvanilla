'use client';

import { useState } from 'react';
import { Receipt, Plus, X } from 'lucide-react';
import { useDashboard, money } from '@/features/dashboard/DashboardProvider';
import { WidgetShell } from './WidgetShell';

export function SpendingWidget() {
  const { spentToday, expenses, today } = useDashboard();
  const [adding, setAdding] = useState(false);
  const [amount, setAmount] = useState('');

  async function add() {
    const n = parseFloat(amount);
    if (!Number.isFinite(n) || n <= 0) return;
    await expenses.insert({ category: 'Quick add', amount: n, date: today });
    setAmount('');
    setAdding(false);
  }

  return (
    <WidgetShell icon={<Receipt size={16} />} title="Spent today" href={adding ? undefined : '/finance'}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-2xl font-semibold text-text-primary">{money(spentToday)}</p>
          <p className="mt-1 text-xs text-text-secondary">
            {spentToday === 0 ? 'nothing yet — nice 🌿' : 'across today'}
          </p>
        </div>
        <button
          onClick={() => setAdding((v) => !v)}
          aria-label={adding ? 'Close' : 'Add expense'}
          className="press rounded-full border border-border bg-white/30 p-1.5 text-text-secondary transition-colors hover:text-[var(--accent)]"
        >
          {adding ? <X size={14} /> : <Plus size={14} />}
        </button>
      </div>

      {adding && (
        <div className="mt-3 flex items-center gap-1.5">
          <input
            type="number"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && add()}
            placeholder="₹ amount"
            aria-label="Amount"
            autoFocus
            className="min-h-[36px] flex-1 rounded-lg border border-border bg-bg-card px-3 text-sm text-text-primary outline-none placeholder:text-text-secondary/60 focus:border-[var(--accent)]"
          />
          <button
            onClick={add}
            disabled={!amount}
            className="min-h-[36px] rounded-lg bg-[var(--accent)] px-3 text-xs font-medium text-white transition-colors hover:bg-[var(--accent-dark)] disabled:opacity-50"
          >
            Add
          </button>
        </div>
      )}
    </WidgetShell>
  );
}

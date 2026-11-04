'use client';

import { useState } from 'react';
import { Wallet, TrendingUp, TrendingDown, Plus, X } from 'lucide-react';
import { useDashboard, money } from '@/features/dashboard/DashboardProvider';
import { WidgetShell } from './WidgetShell';

export function FinanceWidget() {
  const { balance, monthIncome, monthExpenses, income, expenses, today } = useDashboard();
  const [adding, setAdding] = useState(false);
  const [kind, setKind] = useState<'expense' | 'income'>('expense');
  const [amount, setAmount] = useState('');
  const [saving, setSaving] = useState(false);

  async function add() {
    const n = parseFloat(amount);
    if (!Number.isFinite(n) || n <= 0) return;
    setSaving(true);
    if (kind === 'income') await income.insert({ source: 'Quick add', amount: n, date: today });
    else await expenses.insert({ category: 'Quick add', amount: n, date: today });
    setSaving(false);
    setAmount('');
    setAdding(false);
  }

  return (
    <WidgetShell
      icon={<Wallet size={16} />}
      title="This month"
      href={adding ? undefined : '/finance'}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-text-secondary">Balance</p>
          <p
            className="text-2xl font-semibold"
            style={{ color: balance >= 0 ? 'var(--success)' : 'var(--danger)' }}
          >
            {money(balance)}
          </p>
        </div>
        <button
          onClick={() => setAdding((v) => !v)}
          aria-label={adding ? 'Close' : 'Quick add'}
          className="press rounded-full border border-border bg-white/30 p-1.5 text-text-secondary transition-colors hover:text-[var(--accent)]"
        >
          {adding ? <X size={14} /> : <Plus size={14} />}
        </button>
      </div>

      {adding ? (
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as 'expense' | 'income')}
            aria-label="Type"
            className="min-h-[36px] rounded-lg border border-border bg-bg-card px-2 text-xs text-text-primary outline-none focus:border-[var(--accent)]"
          >
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
          <input
            type="number"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && add()}
            placeholder="₹ amount"
            aria-label="Amount"
            className="min-h-[36px] w-20 flex-1 rounded-lg border border-border bg-bg-card px-2 text-sm text-text-primary outline-none placeholder:text-text-secondary/60 focus:border-[var(--accent)]"
          />
          <button
            onClick={add}
            disabled={saving || !amount}
            className="min-h-[36px] rounded-lg bg-[var(--accent)] px-3 text-xs font-medium text-white transition-colors hover:bg-[var(--accent-dark)] disabled:opacity-50"
          >
            Add
          </button>
        </div>
      ) : (
        <div className="mt-3 flex gap-4 text-xs">
          <span className="flex items-center gap-1 text-text-secondary">
            <TrendingUp size={13} className="text-[var(--success)]" /> {money(monthIncome)}
          </span>
          <span className="flex items-center gap-1 text-text-secondary">
            <TrendingDown size={13} className="text-[var(--danger)]" /> {money(monthExpenses)}
          </span>
        </div>
      )}
    </WidgetShell>
  );
}

'use client';

import { useState } from 'react';
import { CalendarClock, Plus, X } from 'lucide-react';
import { useDashboard, money } from '@/features/dashboard/DashboardProvider';
import { WidgetShell } from './WidgetShell';
import { prettyDate } from '@/lib/utils/date';

export function BillsWidget() {
  const { bills, today } = useDashboard();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [due, setDue] = useState('');

  const upcoming = bills.rows
    .filter((b) => b.status !== 'paid' && b.due_date)
    .sort((a, b) => (a.due_date! < b.due_date! ? -1 : 1))
    .slice(0, 3);

  function urgency(dueDate: string): string {
    const days = Math.round(
      (new Date(`${dueDate}T00:00:00`).getTime() - new Date(`${today}T00:00:00`).getTime()) /
        86400000
    );
    if (days < 0) return 'var(--danger)';
    if (days <= 3) return 'var(--warning)';
    return 'var(--text-secondary)';
  }

  async function add() {
    const n = parseFloat(amount);
    if (!name.trim() || !Number.isFinite(n) || n <= 0) return;
    await bills.insert({
      name: name.trim(),
      amount: n,
      due_date: due || null,
      status: 'due',
    });
    setName('');
    setAmount('');
    setDue('');
    setAdding(false);
  }

  return (
    <WidgetShell
      icon={<CalendarClock size={16} />}
      title="Upcoming bills"
      href={adding ? undefined : '/finance'}
      action={
        <button
          onClick={() => setAdding((v) => !v)}
          aria-label={adding ? 'Close' : 'Add a bill'}
          className="press rounded-full border border-border bg-white/30 p-1.5 text-text-secondary transition-colors hover:text-[var(--accent)]"
        >
          {adding ? <X size={14} /> : <Plus size={14} />}
        </button>
      }
    >
      {adding ? (
        <div className="flex flex-col gap-1.5">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && add()}
            placeholder="Bill name…"
            aria-label="Bill name"
            autoFocus
            className="min-h-[36px] rounded-lg border border-border bg-bg-card px-3 text-sm text-text-primary outline-none placeholder:text-text-secondary/60 focus:border-[var(--accent)]"
          />
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && add()}
              placeholder="₹"
              aria-label="Amount"
              className="min-h-[36px] w-16 rounded-lg border border-border bg-bg-card px-2 text-sm text-text-primary outline-none placeholder:text-text-secondary/60 focus:border-[var(--accent)]"
            />
            <input
              type="date"
              value={due}
              onChange={(e) => setDue(e.target.value)}
              aria-label="Due date"
              className="min-h-[36px] flex-1 rounded-lg border border-border bg-bg-card px-2 text-sm text-text-primary outline-none focus:border-[var(--accent)]"
            />
            <button
              onClick={add}
              disabled={!name.trim() || !amount}
              className="min-h-[36px] rounded-lg bg-[var(--accent)] px-3 text-xs font-medium text-white transition-colors hover:bg-[var(--accent-dark)] disabled:opacity-50"
            >
              Add
            </button>
          </div>
        </div>
      ) : upcoming.length === 0 ? (
        <p className="text-sm text-text-secondary">No bills due. ✨</p>
      ) : (
        <ul className="space-y-2">
          {upcoming.map((b) => (
            <li key={b.id} className="flex items-center justify-between text-sm">
              <span className="min-w-0">
                <span className="block truncate text-text-primary">{b.name}</span>
                <span className="text-[11px]" style={{ color: urgency(b.due_date!) }}>
                  {prettyDate(b.due_date!)}
                </span>
              </span>
              <span className="shrink-0 font-medium text-text-primary">{money(Number(b.amount))}</span>
            </li>
          ))}
        </ul>
      )}
    </WidgetShell>
  );
}

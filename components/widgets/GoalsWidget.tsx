'use client';

import { useState } from 'react';
import { Target, Plus, X } from 'lucide-react';
import { useDashboard } from '@/features/dashboard/DashboardProvider';
import { WidgetShell } from './WidgetShell';
import { ProgressBar } from '@/components/ui/ProgressBar';

export function GoalsWidget() {
  const { goals } = useDashboard();
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState('');
  const active = goals.rows.filter((g) => !g.completed).slice(0, 3);

  async function add() {
    if (!title.trim()) return;
    await goals.insert({ title: title.trim() });
    setTitle('');
    setAdding(false);
  }

  return (
    <WidgetShell
      icon={<Target size={16} />}
      title="Goals"
      href={adding ? undefined : '/goals'}
      action={
        <button
          onClick={() => setAdding((v) => !v)}
          aria-label={adding ? 'Close' : 'Add goal'}
          className="press rounded-full border border-border bg-white/30 p-1.5 text-text-secondary transition-colors hover:text-[var(--accent)]"
        >
          {adding ? <X size={14} /> : <Plus size={14} />}
        </button>
      }
    >
      {adding ? (
        <div className="flex items-center gap-1.5">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && add()}
            placeholder="New goal…"
            aria-label="Goal"
            autoFocus
            className="min-h-[36px] flex-1 rounded-lg border border-border bg-bg-card px-3 text-sm text-text-primary outline-none placeholder:text-text-secondary/60 focus:border-[var(--accent)]"
          />
          <button
            onClick={add}
            disabled={!title.trim()}
            className="min-h-[36px] rounded-lg bg-[var(--accent)] px-3 text-xs font-medium text-white transition-colors hover:bg-[var(--accent-dark)] disabled:opacity-50"
          >
            Add
          </button>
        </div>
      ) : active.length === 0 ? (
        <p className="text-sm text-text-secondary">No active goals.</p>
      ) : (
        <ul className="space-y-3">
          {active.map((g) => (
            <li key={g.id}>
              <div className="mb-1 flex items-center justify-between gap-2">
                <p className="truncate text-sm text-text-primary">{g.title}</p>
                <span className="shrink-0 text-xs text-text-secondary">{g.progress_percent}%</span>
              </div>
              <ProgressBar value={g.progress_percent} />
            </li>
          ))}
        </ul>
      )}
    </WidgetShell>
  );
}

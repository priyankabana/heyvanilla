'use client';

import { useState } from 'react';
import { CheckSquare, Plus, X } from 'lucide-react';
import { useDashboard } from '@/features/dashboard/DashboardProvider';
import { WidgetShell } from './WidgetShell';

export function TasksWidget() {
  const { tasks, today } = useDashboard();
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState('');

  const open = tasks.rows
    .filter((t) => !t.completed)
    .sort((a, b) => {
      const aDue = a.due_date ?? '9999';
      const bDue = b.due_date ?? '9999';
      if (aDue !== bDue) return aDue < bDue ? -1 : 1;
      return a.position - b.position;
    })
    .slice(0, 5);

  async function add() {
    if (!title.trim()) return;
    const maxPos = tasks.rows.reduce((m, t) => Math.max(m, t.position), 0);
    await tasks.insert({ title: title.trim(), position: maxPos + 1 });
    setTitle('');
    setAdding(false);
  }

  return (
    <WidgetShell
      icon={<CheckSquare size={16} />}
      title="Tasks"
      href={adding ? undefined : '/tasks'}
      action={
        <button
          onClick={() => setAdding((v) => !v)}
          aria-label={adding ? 'Close' : 'Add task'}
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
            placeholder="New task…"
            aria-label="Task"
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
      ) : open.length === 0 ? (
        <p className="text-sm text-text-secondary">All clear. 🎉</p>
      ) : (
        <ul className="space-y-2">
          {open.map((t) => {
            const overdue = t.due_date && t.due_date < today;
            return (
              <li key={t.id}>
                <button
                  onClick={() => tasks.update(t.id, { completed: true })}
                  className="group flex w-full items-center gap-2.5 text-left text-sm"
                >
                  <span className="h-5 w-5 shrink-0 rounded-full border-2 border-border transition-colors group-hover:border-[var(--accent)]" />
                  <span className="truncate text-text-primary">{t.title}</span>
                  {overdue && (
                    <span className="ml-auto shrink-0 text-[10px] font-medium text-[var(--danger)]">
                      overdue
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </WidgetShell>
  );
}

'use client';

import { useState } from 'react';
import { Plus, Trash2, Check } from 'lucide-react';
import { celebrate } from '@/lib/confetti';
import { useRows } from '@/lib/hooks/useRows';
import type { Json } from '@/lib/supabase/types';
import { prettyDate } from '@/lib/utils/date';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Modal } from '@/components/ui/Modal';
import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { EmptyState } from '@/components/ui/EmptyState';
import { Spinner } from '@/components/ui/Spinner';

interface SubTask {
  id: string;
  text: string;
  done: boolean;
}

function readSubtasks(raw: Json): SubTask[] {
  if (Array.isArray(raw)) {
    return (raw as unknown[]).filter(
      (s) =>
        !!s && typeof s === 'object' && 'text' in (s as object) && 'done' in (s as object)
    ) as unknown as SubTask[];
  }
  return [];
}

export function GoalsView() {
  const { rows, loading, insert, update, remove } = useRows('goals', { orderBy: 'deadline' });

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [why, setWhy] = useState('');
  const [deadline, setDeadline] = useState('');
  const [saving, setSaving] = useState(false);

  async function add() {
    if (!title.trim()) return;
    setSaving(true);
    await insert({
      title: title.trim(),
      why_matters: why.trim() || null,
      deadline: deadline || null,
      progress_percent: 0,
      subtasks: [],
    });
    setSaving(false);
    setTitle('');
    setWhy('');
    setDeadline('');
    setOpen(false);
  }

  function bump(id: string, current: number, delta: number) {
    const next = Math.max(0, Math.min(100, current + delta));
    if (next >= 100 && current < 100) celebrate();
    update(id, { progress_percent: next, completed: next >= 100 });
  }

  function addSub(id: string, subs: SubTask[], text: string) {
    if (!text.trim()) return;
    const next = [...subs, { id: crypto.randomUUID(), text: text.trim(), done: false }];
    update(id, { subtasks: next as unknown as Json });
  }

  function toggleSub(id: string, subs: SubTask[], subId: string) {
    const next = subs.map((s) => (s.id === subId ? { ...s, done: !s.done } : s));
    const pct = next.length ? Math.round((next.filter((s) => s.done).length / next.length) * 100) : 0;
    if (pct >= 100) celebrate();
    update(id, { subtasks: next as unknown as Json, progress_percent: pct, completed: pct >= 100 });
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Goals"
        subtitle="the bigger things. broken into pieces you can actually carry."
        action={
          <Button onClick={() => setOpen(true)}>
            <Plus size={16} /> New
          </Button>
        }
      />

      {rows.length === 0 ? (
        <EmptyState emoji="🎯" title="No goals set" hint="What's one thing you want by the end of the year?" action={<Button onClick={() => setOpen(true)}>Set a goal</Button>} />
      ) : (
        <div className="space-y-4">
          {rows.map((g) => {
            const subs = readSubtasks(g.subtasks);
            return (
              <Card key={g.id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-text-primary">{g.title}</p>
                    {g.why_matters && <p className="mt-0.5 text-xs italic text-text-secondary">{g.why_matters}</p>}
                    {g.deadline && <p className="mt-0.5 text-xs text-text-secondary">by {prettyDate(g.deadline)}</p>}
                  </div>
                  <button onClick={() => remove(g.id)} aria-label="Delete goal" className="rounded-full p-1.5 text-text-secondary transition-colors hover:text-[var(--danger)]">
                    <Trash2 size={15} />
                  </button>
                </div>

                <div className="mt-3 flex items-center gap-3">
                  <ProgressBar value={g.progress_percent} />
                  <span className="w-10 shrink-0 text-right text-xs font-medium text-text-secondary">{g.progress_percent}%</span>
                </div>

                <div className="mt-2 flex gap-2">
                  <button onClick={() => bump(g.id, g.progress_percent, -10)} className="rounded-full border border-border px-2.5 py-1 text-xs text-text-secondary hover:text-text-primary">-10%</button>
                  <button onClick={() => bump(g.id, g.progress_percent, 10)} className="rounded-full border border-border px-2.5 py-1 text-xs text-text-secondary hover:text-text-primary">+10%</button>
                </div>

                {subs.length > 0 && (
                  <ul className="mt-3 space-y-1.5">
                    {subs.map((s) => (
                      <li key={s.id}>
                        <button onClick={() => toggleSub(g.id, subs, s.id)} className="flex w-full items-center gap-2 text-left text-sm">
                          <span
                            className="flex h-4 w-4 shrink-0 items-center justify-center rounded border"
                            style={{ borderColor: s.done ? 'var(--accent)' : 'var(--border)', backgroundColor: s.done ? 'var(--accent)' : 'transparent' }}
                          >
                            {s.done && <Check size={11} className="text-white" />}
                          </span>
                          <span className={s.done ? 'text-text-secondary line-through' : 'text-text-primary'}>{s.text}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                <SubInput onAdd={(text) => addSub(g.id, subs, text)} />
              </Card>
            );
          })}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="New goal">
        <div className="flex flex-col gap-4">
          <Input name="title" label="Goal" placeholder="Learn to swim, ship my portfolio..." value={title} onChange={(e) => setTitle(e.target.value)} />
          <Textarea name="why" label="Why it matters (optional)" placeholder="The reason behind it." value={why} onChange={(e) => setWhy(e.target.value)} />
          <Input name="deadline" type="date" label="Deadline (optional)" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
          <Button onClick={add} loading={saving} disabled={!title.trim()} className="w-full">Add goal</Button>
        </div>
      </Modal>
    </>
  );
}

function SubInput({ onAdd }: { onAdd: (text: string) => void }) {
  const [text, setText] = useState('');
  return (
    <div className="mt-3 flex gap-2">
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            onAdd(text);
            setText('');
          }
        }}
        placeholder="add a step..."
        className="min-h-[36px] flex-1 rounded-[var(--radius)] border border-border bg-white/40 px-3 text-xs text-text-primary outline-none focus:border-[var(--accent)]"
      />
      <button
        onClick={() => {
          onAdd(text);
          setText('');
        }}
        className="rounded-[var(--radius)] border border-border px-3 text-xs text-text-secondary hover:text-text-primary"
      >
        Add
      </button>
    </div>
  );
}

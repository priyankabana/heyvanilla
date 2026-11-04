'use client';

import { useState } from 'react';
import { StickyNote, Plus, X } from 'lucide-react';
import { useDashboard } from '@/features/dashboard/DashboardProvider';
import type { Json } from '@/lib/supabase/types';
import { WidgetShell } from './WidgetShell';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';

// Mirror of NotesView's parser: notes store JSON (or legacy plain text).
function snippet(content: Json): string {
  let title = '';
  let text = '';
  if (typeof content === 'string') {
    try {
      const o = JSON.parse(content) as { title?: string; text?: string };
      title = o.title ?? '';
      text = o.text ?? '';
    } catch {
      text = content;
    }
  }
  return title || text || '(empty)';
}

/** A quick-jot notes card: shows your latest few, and a + opens an inline
 *  popup to add a new one without leaving the dashboard. */
export function NotesWidget() {
  const { notes } = useDashboard();
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);

  const recent = notes.rows
    .slice()
    .sort((a, b) => Number(b.pinned) - Number(a.pinned))
    .slice(0, 4);

  async function add() {
    if (!title.trim() && !text.trim()) return;
    setSaving(true);
    await notes.insert({
      content: JSON.stringify({ title: title.trim(), text: text.trim() }),
      color: '#fde2e4',
    });
    setSaving(false);
    setTitle('');
    setText('');
    setAdding(false);
  }

  return (
    <WidgetShell
      icon={<StickyNote size={16} />}
      title="Notes"
      href={adding ? undefined : '/notes'}
      action={
        <button
          onClick={() => setAdding((v) => !v)}
          aria-label={adding ? 'Close' : 'Add note'}
          className="press rounded-full border border-border bg-white/30 p-1.5 text-text-secondary transition-colors hover:text-[var(--accent)]"
        >
          {adding ? <X size={14} /> : <Plus size={14} />}
        </button>
      }
    >
      <div className="flex h-full flex-col">
        {adding ? (
          <div className="flex flex-col gap-2">
            <Input
              name="quick-note-title"
              label=""
              placeholder="Title (optional)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <Textarea
              name="quick-note-text"
              placeholder="Jot something…"
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="min-h-[70px]"
            />
            <button
              onClick={add}
              disabled={saving || (!title.trim() && !text.trim())}
              className="self-end rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[var(--accent-dark)] disabled:opacity-50"
            >
              Save
            </button>
          </div>
        ) : recent.length === 0 ? (
          <p className="text-sm text-text-secondary">Nothing jotted yet.</p>
        ) : (
          <ul className="space-y-1.5">
            {recent.map((n) => (
              <li key={n.id} className="flex items-center gap-2 text-sm text-text-primary">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent)]" />
                <span className="truncate">{snippet(n.content)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </WidgetShell>
  );
}

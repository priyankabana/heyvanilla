'use client';

import { useMemo, useState } from 'react';
import { Plus, Trash2, Pin, Pencil } from 'lucide-react';
import { useRows } from '@/lib/hooks/useRows';
import type { Json } from '@/lib/supabase/types';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageSkeleton } from '@/components/ui/Skeleton';
import { cn } from '@/lib/utils/cn';

const COLORS = ['#fde2e4', '#e2f0cb', '#cde7f0', '#f0e6cd', '#e7d6f0', '#ffffff'];

interface NoteBody {
  title: string;
  text: string;
  editedAt?: string;
}

// Notes used to store a plain string in `content`; new notes store JSON with a
// title + edited timestamp. Parse handles both.
function parse(content: Json): NoteBody {
  if (content && typeof content === 'object' && !Array.isArray(content)) {
    const o = content as Record<string, Json>;
    return {
      title: typeof o.title === 'string' ? o.title : '',
      text: typeof o.text === 'string' ? o.text : '',
      editedAt: typeof o.editedAt === 'string' ? o.editedAt : undefined,
    };
  }
  if (typeof content === 'string') {
    try {
      const o = JSON.parse(content) as Record<string, unknown>;
      if (o && (typeof o.title === 'string' || typeof o.text === 'string')) {
        return {
          title: typeof o.title === 'string' ? o.title : '',
          text: typeof o.text === 'string' ? o.text : '',
          editedAt: typeof o.editedAt === 'string' ? o.editedAt : undefined,
        };
      }
    } catch {
      /* plain text note */
    }
    return { title: '', text: content };
  }
  return { title: '', text: '' };
}

function when(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function NotesView() {
  const { rows, loading, insert, update, remove } = useRows('notes', {
    orderBy: 'created_at',
    ascending: false,
  });

  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [saving, setSaving] = useState(false);

  // Pinned first, then newest by edited-or-created time.
  const sorted = useMemo(() => {
    return [...rows].sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      const ta = parse(a.content).editedAt ?? a.created_at;
      const tb = parse(b.content).editedAt ?? b.created_at;
      return tb.localeCompare(ta);
    });
  }, [rows]);

  function openNew() {
    setEditId(null);
    setTitle('');
    setText('');
    setColor(COLORS[0]);
    setOpen(true);
  }
  function openEdit(id: string) {
    const n = rows.find((r) => r.id === id);
    if (!n) return;
    const body = parse(n.content);
    setEditId(id);
    setTitle(body.title);
    setText(body.text);
    setColor(n.color ?? COLORS[0]);
    setOpen(true);
  }

  async function save() {
    if (!title.trim() && !text.trim()) return;
    setSaving(true);
    if (editId) {
      await update(editId, {
        content: JSON.stringify({
          title: title.trim(),
          text: text.trim(),
          editedAt: new Date().toISOString(),
        }),
        color,
      });
    } else {
      await insert({ content: JSON.stringify({ title: title.trim(), text: text.trim() }), color });
    }
    setSaving(false);
    setOpen(false);
  }

  if (loading) return <PageSkeleton />;

  return (
    <>
      <PageHeader
        title="Notes"
        subtitle="little things you don't want to forget."
        action={
          <Button onClick={openNew}>
            <Plus size={16} /> New
          </Button>
        }
      />

      {sorted.length === 0 ? (
        <EmptyState
          emoji="📝"
          title="No notes"
          hint="Jot down anything — a thought, a list, a reminder."
          action={<Button onClick={openNew}>Add a note</Button>}
        />
      ) : (
        <div className="space-y-3">
          {sorted.map((n) => {
            const body = parse(n.content);
            return (
              <div
                key={n.id}
                className="flex flex-col rounded-[var(--radius)] p-4 shadow-sm ring-1 ring-black/5"
                style={{ backgroundColor: n.color ?? '#ffffff' }}
              >
                <div className="mb-1 flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    {body.title && <p className="font-medium text-[#3a3030]">{body.title}</p>}
                    <p className="text-[11px] text-[#7a6f6f]">
                      {when(n.created_at)}
                      {body.editedAt && ` · edited ${when(body.editedAt)}`}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-0.5">
                    <button
                      onClick={() => update(n.id, { pinned: !n.pinned })}
                      aria-label={n.pinned ? 'Unpin' : 'Pin'}
                      className="rounded-full p-1 transition-colors"
                      style={{ color: n.pinned ? '#b3261e' : '#9b8e8e' }}
                    >
                      <Pin size={14} fill={n.pinned ? 'currentColor' : 'none'} />
                    </button>
                    <button
                      onClick={() => openEdit(n.id)}
                      aria-label="Edit note"
                      className="rounded-full p-1 text-[#9b8e8e] transition-colors hover:text-[#3a3030]"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => remove(n.id)}
                      aria-label="Delete note"
                      className="rounded-full p-1 text-[#9b8e8e] transition-colors hover:text-[#b3261e]"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                {body.text && (
                  <p className="whitespace-pre-wrap break-words text-sm text-[#3a3030]">{body.text}</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editId ? 'Edit note' : 'New note'}>
        <div className="flex flex-col gap-4">
          <Input
            name="note-title"
            label="Title (optional)"
            placeholder="A short heading…"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Textarea
            name="note-text"
            label="Note"
            placeholder="Type away… (a one-liner is fine too)"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <div>
            <p className="mb-2 text-xs font-medium text-text-secondary">Colour</p>
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  aria-label={`Colour ${c}`}
                  className={cn(
                    'h-8 w-8 rounded-full ring-1 ring-black/10 transition-transform',
                    color === c && 'scale-110 ring-2 ring-[var(--accent)]'
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <Button
            onClick={save}
            loading={saving}
            disabled={!title.trim() && !text.trim()}
            className="w-full"
          >
            {editId ? 'Save changes' : 'Save note'}
          </Button>
        </div>
      </Modal>
    </>
  );
}

'use client';

import { useMemo, useState } from 'react';
import { Plus, Trash2, Search, Hash } from 'lucide-react';
import { useRows } from '@/lib/hooks/useRows';
import type { JournalType, Json } from '@/lib/supabase/types';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Modal } from '@/components/ui/Modal';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageSkeleton } from '@/components/ui/Skeleton';

const MOODS = ['😊', '😌', '😢', '😰', '🥰'];
const TYPE_LABEL: Record<JournalType, string> = {
  gratitude: 'Gratitude',
  reflection: 'Reflection',
  free: 'Free write',
};

type Tab = 'all' | JournalType;
const TABS: { key: Tab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'gratitude', label: 'Gratitude' },
  { key: 'reflection', label: 'Reflection' },
  { key: 'free', label: 'Free write' },
];

function bodyOf(content: Json): string {
  if (content && typeof content === 'object' && !Array.isArray(content)) {
    const t = (content as Record<string, Json>).text;
    return typeof t === 'string' ? t : '';
  }
  return typeof content === 'string' ? content : '';
}

// Pull "#tag" tokens out of free text so people can tag inline too.
function parseTags(raw: string): string[] {
  const inline = Array.from(raw.matchAll(/#(\w+)/g)).map((m) => (m[1] ?? '').toLowerCase());
  return Array.from(new Set(inline));
}

export function JournalView() {
  const { rows, loading, insert, remove } = useRows('journal_entries', {
    orderBy: 'created_at',
    ascending: false,
  });

  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>('all');
  const [query, setQuery] = useState('');

  const [type, setType] = useState<JournalType>('free');
  const [text, setText] = useState('');
  const [mood, setMood] = useState(MOODS[0]);
  const [tagInput, setTagInput] = useState('');
  const [photo, setPhoto] = useState('');
  const [saving, setSaving] = useState(false);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((e) => {
      if (tab !== 'all' && e.type !== tab) return false;
      if (!q) return true;
      const inBody = bodyOf(e.content).toLowerCase().includes(q);
      const inTags = (e.tags ?? []).some((t) => t.toLowerCase().includes(q.replace('#', '')));
      return inBody || inTags;
    });
  }, [rows, tab, query]);

  async function add() {
    if (!text.trim()) return;
    setSaving(true);
    const manualTags = tagInput
      .split(',')
      .map((t) => t.trim().replace(/^#/, '').toLowerCase())
      .filter(Boolean);
    const tags = Array.from(new Set([...manualTags, ...parseTags(text)]));
    await insert({
      type,
      content: { text: text.trim() },
      mood,
      tags: tags.length ? tags : null,
      photo_url: photo.trim() || null,
    });
    setSaving(false);
    setText('');
    setType('free');
    setMood(MOODS[0]);
    setTagInput('');
    setPhoto('');
    setOpen(false);
  }

  if (loading) return <PageSkeleton />;

  return (
    <>
      <PageHeader
        title="Journal"
        subtitle="a quiet page that's just yours."
        action={
          <Button onClick={() => setOpen(true)}>
            <Plus size={16} /> Write
          </Button>
        }
      />

      {/* search + tabs */}
      <div className="mb-4 space-y-3">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search your entries…"
            className="min-h-[44px] w-full rounded-[var(--radius)] border border-border bg-white/40 pl-9 pr-3 text-sm text-text-primary outline-none transition-all focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {TABS.map((t) => (
            <Chip key={t.key} active={tab === t.key} onClick={() => setTab(t.key)}>
              {t.label}
            </Chip>
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <EmptyState
          emoji="📖"
          title={query || tab !== 'all' ? 'Nothing here' : 'Blank page'}
          hint={
            query || tab !== 'all'
              ? 'No entries match this filter.'
              : 'Three lines about your day counts. Start there.'
          }
          action={!query && tab === 'all' ? <Button onClick={() => setOpen(true)}>Write something</Button> : undefined}
        />
      ) : (
        <div className="space-y-3">
          {visible.map((e) => (
            <Card key={e.id}>
              <div className="mb-2 flex items-center justify-between">
                <span className="flex items-center gap-2 text-xs text-text-secondary">
                  <span className="text-base">{e.mood ?? ''}</span>
                  {TYPE_LABEL[e.type]} ·{' '}
                  {new Date(e.created_at).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
                <button
                  onClick={() => remove(e.id)}
                  aria-label="Delete entry"
                  className="rounded-full p-1.5 text-text-secondary transition-colors hover:text-[var(--danger)]"
                >
                  <Trash2 size={15} />
                </button>
              </div>
              {e.photo_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={e.photo_url}
                  alt=""
                  className="mb-3 max-h-64 w-full rounded-[var(--radius)] object-cover"
                />
              )}
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-text-primary">
                {bodyOf(e.content)}
              </p>
              {e.tags && e.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {e.tags.map((t) => (
                    <button
                      key={t}
                      onClick={() => setQuery(t)}
                      className="flex items-center gap-0.5 rounded-full bg-bg-secondary px-2 py-0.5 text-[11px] text-text-secondary transition-colors hover:text-[var(--accent)]"
                    >
                      <Hash size={9} />
                      {t}
                    </button>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="New entry">
        <div className="flex flex-col gap-4">
          <Select
            name="type"
            label="Type"
            value={type}
            onChange={(ev) => setType(ev.target.value as JournalType)}
            options={[
              { value: 'free', label: 'Free write' },
              { value: 'gratitude', label: 'Gratitude' },
              { value: 'reflection', label: 'Reflection' },
            ]}
          />
          <div>
            <p className="mb-2 text-xs font-medium text-text-secondary">How are you feeling?</p>
            <div className="flex gap-2">
              {MOODS.map((m) => (
                <button
                  key={m}
                  onClick={() => setMood(m)}
                  className="flex h-10 w-10 items-center justify-center rounded-full border text-lg transition-all"
                  style={{
                    borderColor: mood === m ? 'var(--accent)' : 'var(--border)',
                    backgroundColor: mood === m ? 'var(--accent-light)' : 'transparent',
                  }}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
          <Textarea
            name="entry"
            label="Your words"
            placeholder="Today... (use #tags inline if you like)"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <Input
            name="tags"
            label="Tags (optional, comma-separated)"
            placeholder="travel, work, love"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
          />
          <Input
            name="photo"
            label="Photo URL (optional)"
            placeholder="https://…"
            value={photo}
            onChange={(e) => setPhoto(e.target.value)}
          />
          <Button onClick={add} loading={saving} disabled={!text.trim()} className="w-full">
            Save entry
          </Button>
        </div>
      </Modal>
    </>
  );
}

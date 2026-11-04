'use client';

import { useState } from 'react';
import { Plus, Trash2, Star, Clapperboard } from 'lucide-react';
import { useRows } from '@/lib/hooks/useRows';
import type { MediaType } from '@/lib/supabase/types';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { EmptyState } from '@/components/ui/EmptyState';
import { Spinner } from '@/components/ui/Spinner';

type Tab = 'all' | MediaType;
const STATUS = [
  { value: 'planned', label: 'Want to' },
  { value: 'in-progress', label: 'In progress' },
  { value: 'done', label: 'Finished' },
];

export function MediaView() {
  const { rows, loading, insert, update, remove } = useRows('media', {});
  const [tab, setTab] = useState<Tab>('all');
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [type, setType] = useState<MediaType>('movie');
  const [status, setStatus] = useState('planned');
  const [saving, setSaving] = useState(false);

  const items = tab === 'all' ? rows : rows.filter((r) => r.type === tab);

  async function add() {
    if (!title.trim()) return;
    setSaving(true);
    // Try to grab a poster from TMDB for movies/shows (no-op if no key set).
    let poster_url: string | null = null;
    if (type !== 'book') {
      try {
        const res = await fetch(`/api/tmdb?q=${encodeURIComponent(title.trim())}&type=${type}`);
        if (res.ok) poster_url = (await res.json()).poster_url ?? null;
      } catch {
        poster_url = null;
      }
    }
    await insert({ title: title.trim(), type, status, rating: null, poster_url });
    setSaving(false);
    setTitle('');
    setType('movie');
    setStatus('planned');
    setOpen(false);
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
        title="Media"
        subtitle="what you're watching and reading."
        action={
          <Button onClick={() => setOpen(true)}>
            <Plus size={16} /> Add
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        <Chip active={tab === 'all'} onClick={() => setTab('all')}>All</Chip>
        <Chip active={tab === 'movie'} onClick={() => setTab('movie')}>Movies</Chip>
        <Chip active={tab === 'show'} onClick={() => setTab('show')}>Shows</Chip>
        <Chip active={tab === 'book'} onClick={() => setTab('book')}>Books</Chip>
      </div>

      {items.length === 0 ? (
        <EmptyState emoji="🎬" title="Nothing tracked yet" hint="Add a film, a show or a book you want to remember." action={<Button onClick={() => setOpen(true)}>Add one</Button>} />
      ) : (
        <div className="space-y-2">
          {items.map((m) => (
            <Card key={m.id} className="flex items-center gap-3 p-3.5">
              {m.poster_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={m.poster_url} alt={m.title} width={40} height={60} className="h-[60px] w-10 shrink-0 rounded-md object-cover" />
              ) : (
                <span className="flex h-[60px] w-10 shrink-0 items-center justify-center rounded-md bg-bg-secondary text-text-secondary">
                  <Clapperboard size={16} />
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-text-primary">{m.title}</p>
                <p className="text-xs capitalize text-text-secondary">{m.type} · {STATUS.find((s) => s.value === m.status)?.label ?? m.status}</p>
              </div>
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} onClick={() => update(m.id, { rating: n })} aria-label={`Rate ${n}`}>
                    <Star size={15} fill={(m.rating ?? 0) >= n ? 'var(--accent)' : 'none'} className={(m.rating ?? 0) >= n ? 'text-[var(--accent)]' : 'text-text-secondary'} />
                  </button>
                ))}
              </div>
              <button onClick={() => remove(m.id)} aria-label="Delete" className="rounded-full p-1.5 text-text-secondary transition-colors hover:text-[var(--danger)]">
                <Trash2 size={15} />
              </button>
            </Card>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Add to library">
        <div className="flex flex-col gap-4">
          <Input name="title" label="Title" placeholder="Name of the film / show / book" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Select name="type" label="Type" value={type} onChange={(e) => setType(e.target.value as MediaType)} options={[{ value: 'movie', label: 'Movie' }, { value: 'show', label: 'Show' }, { value: 'book', label: 'Book' }]} />
          <Select name="status" label="Status" value={status} onChange={(e) => setStatus(e.target.value)} options={STATUS} />
          <Button onClick={add} loading={saving} disabled={!title.trim()} className="w-full">Add</Button>
        </div>
      </Modal>
    </>
  );
}

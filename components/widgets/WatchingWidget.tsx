'use client';

import { useState } from 'react';
import { Clapperboard, Star, Plus, X } from 'lucide-react';
import { useDashboard } from '@/features/dashboard/DashboardProvider';
import { WidgetShell } from './WidgetShell';

export function WatchingWidget() {
  const { media } = useDashboard();
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [kind, setKind] = useState<'movie' | 'show'>('show');

  const show = media.rows.find(
    (m) => (m.type === 'show' || m.type === 'movie') && m.status === 'watching'
  );

  async function add() {
    if (!title.trim()) return;
    await media.insert({ title: title.trim(), type: kind, status: 'watching', rating: 0 });
    setTitle('');
    setKind('show');
    setAdding(false);
  }

  return (
    <WidgetShell
      icon={<Clapperboard size={16} />}
      title="Currently watching"
      href={adding ? undefined : '/media'}
      action={
        <button
          onClick={() => setAdding((v) => !v)}
          aria-label={adding ? 'Close' : 'Add a title'}
          className="press rounded-full border border-border bg-white/30 p-1.5 text-text-secondary transition-colors hover:text-[var(--accent)]"
        >
          {adding ? <X size={14} /> : <Plus size={14} />}
        </button>
      }
    >
      {adding ? (
        <div className="flex flex-col gap-1.5">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && add()}
            placeholder="Movie or show…"
            aria-label="Title"
            autoFocus
            className="min-h-[36px] rounded-lg border border-border bg-bg-card px-3 text-sm text-text-primary outline-none placeholder:text-text-secondary/60 focus:border-[var(--accent)]"
          />
          <div className="flex items-center gap-1.5">
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value as 'movie' | 'show')}
              aria-label="Type"
              className="min-h-[36px] rounded-lg border border-border bg-bg-card px-2 text-xs text-text-primary outline-none focus:border-[var(--accent)]"
            >
              <option value="show">Show</option>
              <option value="movie">Movie</option>
            </select>
            <button
              onClick={add}
              disabled={!title.trim()}
              className="min-h-[36px] flex-1 rounded-lg bg-[var(--accent)] px-3 text-xs font-medium text-white transition-colors hover:bg-[var(--accent-dark)] disabled:opacity-50"
            >
              Add
            </button>
          </div>
        </div>
      ) : !show ? (
        <div className="flex h-full flex-col items-center justify-center text-center">
          <p className="text-sm text-text-secondary">Nothing on right now.</p>
          <button
            onClick={() => setAdding(true)}
            className="mt-1 text-xs text-[var(--accent)] hover:underline"
          >
            add your fav movie or show →
          </button>
        </div>
      ) : (
        <div className="flex gap-3">
          {show.poster_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={show.poster_url}
              alt={show.title}
              width={48}
              height={68}
              className="h-[68px] w-[48px] shrink-0 rounded-md object-cover"
            />
          ) : (
            <div className="flex h-[68px] w-[48px] shrink-0 items-center justify-center rounded-md bg-bg-secondary text-xl">
              🎬
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-text-primary">{show.title}</p>
            <p className="text-xs capitalize text-text-secondary">{show.type}</p>
            {typeof show.rating === 'number' && show.rating > 0 && (
              <p className="mt-1 flex items-center gap-0.5 text-[var(--accent)]">
                {Array.from({ length: show.rating }).map((_, i) => (
                  <Star key={i} size={12} fill="currentColor" />
                ))}
              </p>
            )}
          </div>
        </div>
      )}
    </WidgetShell>
  );
}

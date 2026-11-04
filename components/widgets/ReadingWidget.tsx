'use client';

import { useState } from 'react';
import { BookOpen, Plus, X } from 'lucide-react';
import { useDashboard } from '@/features/dashboard/DashboardProvider';
import { WidgetShell } from './WidgetShell';
import { ProgressBar } from '@/components/ui/ProgressBar';

export function ReadingWidget() {
  const { media } = useDashboard();
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');

  const book = media.rows.find(
    (m) => m.type === 'book' && (m.status === 'reading' || m.status === 'in-progress')
  );

  async function add() {
    if (!title.trim()) return;
    await media.insert({
      title: title.trim(),
      type: 'book',
      status: 'reading',
      author: author.trim() || null,
      progress: 0,
    });
    setTitle('');
    setAuthor('');
    setAdding(false);
  }

  return (
    <WidgetShell
      icon={<BookOpen size={16} />}
      title="Currently reading"
      href={adding ? undefined : '/media'}
      action={
        <button
          onClick={() => setAdding((v) => !v)}
          aria-label={adding ? 'Close' : 'Add a book'}
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
            placeholder="Book title…"
            aria-label="Book title"
            autoFocus
            className="min-h-[36px] rounded-lg border border-border bg-bg-card px-3 text-sm text-text-primary outline-none placeholder:text-text-secondary/60 focus:border-[var(--accent)]"
          />
          <div className="flex items-center gap-1.5">
            <input
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && add()}
              placeholder="Author (optional)"
              aria-label="Author"
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
        </div>
      ) : !book ? (
        <div className="flex h-full flex-col items-center justify-center text-center">
          <p className="text-sm text-text-secondary">Nothing on the nightstand.</p>
          <button
            onClick={() => setAdding(true)}
            className="mt-1 text-xs text-[var(--accent)] hover:underline"
          >
            add your fav book →
          </button>
        </div>
      ) : (
        <div className="flex gap-3">
          {book.poster_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={book.poster_url}
              alt={book.title}
              width={48}
              height={68}
              className="h-[68px] w-[48px] shrink-0 rounded-md object-cover"
            />
          ) : (
            <div className="flex h-[68px] w-[48px] shrink-0 items-center justify-center rounded-md bg-bg-secondary text-xl">
              📖
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-text-primary">{book.title}</p>
            {book.author && <p className="truncate text-xs text-text-secondary">{book.author}</p>}
            {typeof book.progress === 'number' && (
              <div className="mt-2">
                <ProgressBar value={book.progress} />
              </div>
            )}
          </div>
        </div>
      )}
    </WidgetShell>
  );
}

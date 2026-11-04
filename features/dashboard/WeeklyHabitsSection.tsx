'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Plus, Trash2, Check, X, Flame, Clock, Pencil, ChevronLeft, ChevronRight } from 'lucide-react';
import { useDashboard } from './DashboardProvider';
import { useSupabase } from '@/components/providers/SupabaseProvider';
import { writer } from '@/lib/supabase/write';
import { toISODate } from '@/lib/utils/date';

const DAY_INITIALS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const EMOJIS = ['💧', '📖', '🏃', '🛌', '🧘', '🍎', '✍️', '🎵', '🌱', '☀️'];
const TIMES_KEY = 'heyvanilla_habit_times';

const EXAMPLES = [
  { name: 'Drink water', icon: '💧', start: '' },
  { name: 'GYM', icon: '🏃', start: '08:00', end: '09:00' },
  { name: 'Read a little', icon: '📖', start: '21:00' },
  { name: 'Sleep early', icon: '🛌', start: '23:00' },
];
const SEED_FLAG = 'heyvanilla_seeded_habits';

interface TimeSlot {
  start?: string;
  end?: string;
}
type TimeMap = Record<string, TimeSlot>;

function fmt(hhmm: string): string {
  const [hStr, mStr] = hhmm.split(':');
  const h = Number(hStr);
  const m = Number(mStr);
  const ap = h >= 12 ? 'PM' : 'AM';
  const hr = h % 12 || 12;
  return m ? `${hr}:${`${m}`.padStart(2, '0')} ${ap}` : `${hr} ${ap}`;
}
function fmtRange(slot?: TimeSlot): string {
  if (!slot?.start) return '';
  return slot.end ? `${fmt(slot.start)}–${fmt(slot.end)}` : fmt(slot.start);
}

interface Draft {
  id?: string;
  name: string;
  icon: string;
  start: string;
  end: string;
}
const EMPTY_DRAFT: Draft = { name: '', icon: '💧', start: '', end: '' };

/** The merged "schedule + habits" module. A separate Time column, a weekly
 *  check-off grid, ‹ › week navigation (so past records stay editable), plus
 *  add / edit / delete. */
export function WeeklyHabitsSection() {
  const { habits, habitLogs, today } = useDashboard();
  const { supabase, user } = useSupabase();

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [times, setTimes] = useState<TimeMap>({});
  const [weekOffset, setWeekOffset] = useState(0);
  const [customEmoji, setCustomEmoji] = useState(false);
  const seeded = useRef(false);

  useEffect(() => {
    try {
      setTimes(JSON.parse(localStorage.getItem(TIMES_KEY) ?? '{}') as TimeMap);
    } catch {
      /* ignore */
    }
  }, []);

  function saveTimes(next: TimeMap) {
    setTimes(next);
    try {
      localStorage.setItem(TIMES_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }

  // The selected week (offset 0 = this week), Sunday → Saturday.
  const week = useMemo(() => {
    const base = new Date();
    base.setDate(base.getDate() + weekOffset * 7);
    const dow = base.getDay();
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(base);
      d.setDate(base.getDate() - dow + i);
      const iso = toISODate(d);
      return { iso, initial: DAY_INITIALS[i], date: d.getDate(), isToday: iso === today };
    });
  }, [weekOffset, today]);

  const weekLabel =
    weekOffset === 0
      ? 'This week'
      : `${new Date(`${week[0]?.iso}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – ${new Date(`${week[6]?.iso}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;

  // Auto-seed examples once, only if the user has no habits at all.
  useEffect(() => {
    if (habits.loading || seeded.current) return;
    if (habits.rows.length === 0 && localStorage.getItem(SEED_FLAG) !== '1') {
      seeded.current = true;
      localStorage.setItem(SEED_FLAG, '1');
      (async () => {
        const map: TimeMap = {};
        for (const ex of EXAMPLES) {
          const created = await habits.insert({ name: ex.name, icon: ex.icon });
          if (created && ex.start) map[created.id] = { start: ex.start, end: ex.end };
        }
        if (Object.keys(map).length) {
          setTimes((prev) => {
            const next = { ...prev, ...map };
            try {
              localStorage.setItem(TIMES_KEY, JSON.stringify(next));
            } catch {
              /* ignore */
            }
            return next;
          });
        }
      })();
    }
  }, [habits.loading, habits.rows.length, habits]);

  const sortedHabits = useMemo(() => {
    return [...habits.rows].sort((a, b) => {
      const sa = times[a.id]?.start ?? '99:99';
      const sb = times[b.id]?.start ?? '99:99';
      return sa.localeCompare(sb);
    });
  }, [habits.rows, times]);

  function logFor(habitId: string, iso: string) {
    return habitLogs.rows.find((l) => l.habit_id === habitId && l.date === iso);
  }

  function streak(habitId: string): number {
    let count = 0;
    for (let i = 0; ; i += 1) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const iso = toISODate(d);
      if (logFor(habitId, iso)?.completed) count += 1;
      else if (i === 0) continue;
      else break;
    }
    return count;
  }

  async function toggle(habitId: string, iso: string) {
    if (!user || iso > today) return;
    const existing = logFor(habitId, iso);
    if (existing) await writer(supabase, 'habit_logs').delete().eq('id', existing.id);
    else
      await writer(supabase, 'habit_logs').insert({
        user_id: user.id,
        habit_id: habitId,
        date: iso,
        completed: true,
      });
    await habitLogs.refresh();
  }

  function openNew() {
    setDraft(EMPTY_DRAFT);
    setCustomEmoji(false);
    setEditing(true);
  }
  function openEdit(id: string) {
    const h = habits.rows.find((x) => x.id === id);
    if (!h) return;
    const slot = times[id];
    const icon = h.icon ?? '💧';
    setDraft({ id, name: h.name, icon, start: slot?.start ?? '', end: slot?.end ?? '' });
    setCustomEmoji(!EMOJIS.includes(icon));
    setEditing(true);
  }

  async function save() {
    if (!draft.name.trim()) return;
    let id = draft.id;
    if (id) {
      await habits.update(id, { name: draft.name.trim(), icon: draft.icon });
    } else {
      const created = await habits.insert({ name: draft.name.trim(), icon: draft.icon });
      id = created?.id;
    }
    if (id) {
      const next = { ...times };
      if (draft.start) next[id] = { start: draft.start, end: draft.end || undefined };
      else delete next[id];
      saveTimes(next);
    }
    setDraft(EMPTY_DRAFT);
    setEditing(false);
  }

  function removeHabit(id: string) {
    habits.remove(id);
    if (times[id]) {
      const next = { ...times };
      delete next[id];
      saveTimes(next);
    }
  }

  const cols = 'minmax(4.5rem, auto) minmax(6rem, 1fr) repeat(7, minmax(1.8rem, 2.4rem))';

  return (
    <section className="reveal glass-card p-5" style={{ ['--reveal-delay' as string]: '0ms' }}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-medium text-text-primary">
          <span className="text-[var(--accent)]">
            <Flame size={16} />
          </span>
          Habits
        </h2>
        <div className="flex items-center gap-2">
          <Link
            href="/habits"
            className="rounded-full border border-border bg-white/30 px-3 py-1.5 text-xs text-text-secondary transition-colors hover:text-[var(--accent)]"
          >
            Full view
          </Link>
          <button
            onClick={() => (editing ? setEditing(false) : openNew())}
            className="flex items-center gap-1 rounded-full border border-border bg-white/30 px-3 py-1.5 text-xs text-text-secondary transition-colors hover:text-[var(--accent)]"
          >
            {editing ? <X size={13} /> : <Plus size={13} />}
            {editing ? 'Close' : 'Add habit'}
          </button>
        </div>
      </div>

      {/* add / edit form */}
      {editing && (
        <div className="mb-4 rounded-[var(--radius)] border border-border bg-bg-secondary/50 p-3">
          <div className="flex flex-wrap items-center gap-2">
            <input
              value={draft.name}
              onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
              onKeyDown={(e) => e.key === 'Enter' && save()}
              placeholder={draft.id ? 'Habit name' : 'New habit…'}
              aria-label="Habit name"
              autoFocus
              className="min-h-[40px] min-w-[10rem] flex-1 rounded-lg border border-border bg-bg-card px-3 text-sm text-text-primary outline-none placeholder:text-text-secondary/60 focus:border-[var(--accent)]"
            />
            <button
              onClick={save}
              disabled={!draft.name.trim()}
              className="min-h-[40px] rounded-lg bg-[var(--accent)] px-4 text-sm font-medium text-white transition-colors hover:bg-[var(--accent-dark)] disabled:opacity-50"
            >
              {draft.id ? 'Save' : 'Add'}
            </button>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-text-secondary">
            <span className="flex items-center gap-1">
              <Clock size={12} /> time (optional)
            </span>
            <input
              type="time"
              value={draft.start}
              onChange={(e) => setDraft((d) => ({ ...d, start: e.target.value }))}
              aria-label="Start time"
              className="min-h-[34px] rounded-lg border border-border bg-bg-card px-2 text-sm text-text-primary outline-none focus:border-[var(--accent)]"
            />
            <span>–</span>
            <input
              type="time"
              value={draft.end}
              onChange={(e) => setDraft((d) => ({ ...d, end: e.target.value }))}
              aria-label="End time"
              className="min-h-[34px] rounded-lg border border-border bg-bg-card px-2 text-sm text-text-primary outline-none focus:border-[var(--accent)]"
            />
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {EMOJIS.map((e) => (
              <button
                key={e}
                onClick={() => {
                  setCustomEmoji(false);
                  setDraft((d) => ({ ...d, icon: e }));
                }}
                className="flex h-8 w-8 items-center justify-center rounded-full border text-base transition-all"
                style={{
                  borderColor: draft.icon === e ? 'var(--accent)' : 'var(--border)',
                  backgroundColor: draft.icon === e ? 'var(--accent-light)' : 'transparent',
                }}
              >
                {e}
              </button>
            ))}

            {/* use any emoji */}
            {customEmoji ? (
              <input
                value={EMOJIS.includes(draft.icon) ? '' : draft.icon}
                onChange={(e) => setDraft((d) => ({ ...d, icon: e.target.value }))}
                placeholder="🙂"
                aria-label="Any emoji"
                autoFocus
                maxLength={8}
                className="h-8 w-12 rounded-full border border-[var(--accent)] bg-[var(--accent-light)] text-center text-base text-text-primary outline-none"
              />
            ) : (
              <button
                onClick={() => {
                  setCustomEmoji(true);
                  setDraft((d) => ({ ...d, icon: '' }));
                }}
                aria-label="Use any emoji"
                title="Use any emoji"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-dashed border-border text-text-secondary transition-colors hover:text-[var(--accent)]"
              >
                <Plus size={14} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* week navigation */}
      <div className="mb-2 flex items-center justify-center gap-3">
        <button
          onClick={() => setWeekOffset((w) => w - 1)}
          aria-label="Previous week"
          className="rounded-full p-1 text-text-secondary transition-colors hover:text-[var(--accent)]"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="min-w-[8rem] text-center text-xs font-medium text-text-primary">{weekLabel}</span>
        <button
          onClick={() => setWeekOffset((w) => w + 1)}
          aria-label="Next week"
          className="rounded-full p-1 text-text-secondary transition-colors hover:text-[var(--accent)]"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {habits.rows.length === 0 ? (
        <p className="py-6 text-center text-sm text-text-secondary">
          No habits yet. Hit <span className="text-[var(--accent)]">Add habit</span> to start tracking.
        </p>
      ) : (
        <div className="overflow-x-auto">
          {/* header */}
          <div className="grid items-center gap-1 pb-2" style={{ gridTemplateColumns: cols }}>
            <span className="pl-1 text-[10px] font-semibold uppercase tracking-wide text-text-secondary">Time</span>
            <span />
            {week.map((d, i) => (
              <div key={i} className="flex flex-col items-center">
                <span className="text-[11px] font-semibold text-text-secondary">{d.initial}</span>
                <span
                  className="text-[10px]"
                  style={{ color: d.isToday ? 'var(--accent)' : 'var(--text-secondary)' }}
                >
                  {d.date}
                </span>
              </div>
            ))}
          </div>

          {/* one row per habit */}
          <div className="space-y-1">
            {sortedHabits.map((h) => {
              const s = streak(h.id);
              const slot = fmtRange(times[h.id]);
              return (
                <div
                  key={h.id}
                  className="group grid items-center gap-1 rounded-xl py-1.5 transition-colors hover:bg-white/10"
                  style={{ gridTemplateColumns: cols }}
                >
                  {/* time column */}
                  <span className="pl-1 text-[11px] tabular-nums text-text-secondary">
                    {slot || '—'}
                  </span>

                  {/* habit name + actions */}
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="text-base">{h.icon ?? '✨'}</span>
                    <span className="min-w-0 flex-1 truncate text-sm text-text-primary">{h.name}</span>
                    {s > 0 && (
                      <span className="hidden items-center gap-0.5 text-[10px] text-text-secondary sm:flex">
                        <Flame size={10} />
                        {s}
                      </span>
                    )}
                    <button
                      onClick={() => openEdit(h.id)}
                      aria-label={`Edit ${h.name}`}
                      className="rounded-full p-1 text-text-secondary opacity-0 transition-all hover:text-[var(--accent)] group-hover:opacity-100"
                    >
                      <Pencil size={12} />
                    </button>
                    <button
                      onClick={() => removeHabit(h.id)}
                      aria-label={`Delete ${h.name}`}
                      className="rounded-full p-1 text-text-secondary opacity-0 transition-all hover:text-[var(--danger)] group-hover:opacity-100"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>

                  {/* day checkboxes */}
                  {week.map((d) => {
                    const done = !!logFor(h.id, d.iso)?.completed;
                    const future = d.iso > today;
                    return (
                      <button
                        key={d.iso}
                        onClick={() => toggle(h.id, d.iso)}
                        disabled={future}
                        aria-label={`${h.name} on ${d.iso}`}
                        className="mx-auto flex h-7 w-7 items-center justify-center rounded-md transition-all disabled:cursor-not-allowed disabled:opacity-30"
                        style={{
                          backgroundColor: done ? 'var(--accent)' : 'var(--bg-secondary)',
                          outline: d.isToday ? '2px solid var(--accent)' : 'none',
                          outlineOffset: 1,
                        }}
                      >
                        {done && <Check size={14} className="text-white" />}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}

'use client';

import { useMemo, useState } from 'react';
import { Plus, Flame, Trash2, Pencil, ChevronLeft, ChevronRight, Bell, Check } from 'lucide-react';
import { useRows } from '@/lib/hooks/useRows';
import { useSupabase } from '@/components/providers/SupabaseProvider';
import { writer } from '@/lib/supabase/write';
import { todayISO, toISODate, monthGrid, monthName } from '@/lib/utils/date';
import type { Habit, FrequencyType } from '@/lib/supabase/types';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { EmptyState } from '@/components/ui/EmptyState';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { PageSkeleton } from '@/components/ui/Skeleton';

const EMOJIS = ['💧', '🏃', '📚', '🧘', '🛌', '🍎', '✍️', '🎵', '💡', '🌱', '🦷', '☀️', '🥗', '💪', '🎨', '📵'];
const COLORS = ['#BC335F', '#7B5EA7', '#3E92CC', '#5FAE7E', '#E0A458', '#D6536B', '#6667AB', '#933F33'];
const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const FREQ_OPTIONS: { value: FrequencyType; label: string }[] = [
  { value: 'daily', label: 'Every day' },
  { value: 'weekly', label: 'Certain days' },
  { value: 'custom', label: 'Custom' },
];

interface Draft {
  id?: string;
  name: string;
  icon: string;
  color: string;
  frequency_type: FrequencyType;
  frequency_days: number[];
  reminder_time: string;
}

const DEFAULT_ICON = '💧';
const DEFAULT_COLOR = '#BC335F';

const EMPTY: Draft = {
  name: '',
  icon: DEFAULT_ICON,
  color: DEFAULT_COLOR,
  frequency_type: 'daily',
  frequency_days: [1, 2, 3, 4, 5],
  reminder_time: '',
};

function isTargetDay(h: Pick<Habit, 'frequency_type' | 'frequency_days'>, iso: string): boolean {
  if (h.frequency_type === 'daily') return true;
  const wd = new Date(`${iso}T00:00:00`).getDay();
  if (!h.frequency_days || h.frequency_days.length === 0) return true;
  return h.frequency_days.includes(wd);
}

export function HabitsView() {
  const { supabase, user } = useSupabase();
  const habits = useRows('habits', { orderBy: 'created_at' });
  const logs = useRows('habit_logs', { realtime: true });

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [saving, setSaving] = useState(false);

  const today = todayISO();
  const { days, startWeekday } = useMemo(() => monthGrid(year, month), [year, month]);

  function logFor(habitId: string, date: string) {
    return logs.rows.find((l) => l.habit_id === habitId && l.date === date);
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

  // Completed target-days / total target-days elapsed this month.
  function monthProgress(h: Habit): { done: number; target: number } {
    let done = 0;
    let target = 0;
    for (const iso of days) {
      if (iso > today) break;
      if (!isTargetDay(h, iso)) continue;
      target += 1;
      if (logFor(h.id, iso)?.completed) done += 1;
    }
    return { done, target };
  }

  async function toggle(habitId: string, date: string) {
    if (!user || date > today) return;
    const existing = logFor(habitId, date);
    if (existing) await writer(supabase, 'habit_logs').delete().eq('id', existing.id);
    else
      await writer(supabase, 'habit_logs').insert({
        user_id: user.id,
        habit_id: habitId,
        date,
        completed: true,
      });
    await logs.refresh();
  }

  function openNew() {
    setDraft(EMPTY);
    setOpen(true);
  }

  function openEdit(h: Habit) {
    setDraft({
      id: h.id,
      name: h.name,
      icon: h.icon ?? DEFAULT_ICON,
      color: h.color ?? DEFAULT_COLOR,
      frequency_type: h.frequency_type,
      frequency_days: h.frequency_days ?? [1, 2, 3, 4, 5],
      reminder_time: h.reminder_time ?? '',
    });
    setOpen(true);
  }

  async function save() {
    if (!draft.name.trim()) return;
    setSaving(true);
    const payload = {
      name: draft.name.trim(),
      icon: draft.icon,
      color: draft.color,
      frequency_type: draft.frequency_type,
      frequency_days: draft.frequency_type === 'daily' ? null : draft.frequency_days,
      reminder_time: draft.reminder_time || null,
    };
    if (draft.id) await habits.update(draft.id, payload);
    else await habits.insert(payload);
    setSaving(false);
    setOpen(false);
  }

  function toggleDay(wd: number) {
    setDraft((d) => ({
      ...d,
      frequency_days: d.frequency_days.includes(wd)
        ? d.frequency_days.filter((x) => x !== wd)
        : [...d.frequency_days, wd].sort(),
    }));
  }

  if (habits.loading) return <PageSkeleton />;

  return (
    <>
      <PageHeader
        title="Habits"
        subtitle="small things, done often. that's the whole secret."
        action={
          <Button onClick={openNew}>
            <Plus size={16} /> New
          </Button>
        }
      />

      {/* Month selector */}
      <div className="mb-5 flex items-center justify-center gap-4">
        <button
          onClick={() => {
            if (month === 0) {
              setMonth(11);
              setYear((y) => y - 1);
            } else setMonth((m) => m - 1);
          }}
          aria-label="Previous month"
          className="rounded-full border border-border bg-white/30 p-2 text-text-secondary transition-colors hover:text-[var(--accent)]"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="min-w-[10rem] text-center text-sm font-medium text-text-primary">
          {monthName(month)} {year}
        </span>
        <button
          onClick={() => {
            if (month === 11) {
              setMonth(0);
              setYear((y) => y + 1);
            } else setMonth((m) => m + 1);
          }}
          aria-label="Next month"
          className="rounded-full border border-border bg-white/30 p-2 text-text-secondary transition-colors hover:text-[var(--accent)]"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {habits.rows.length === 0 ? (
        <EmptyState
          emoji="🌱"
          title="No habits yet"
          hint="Start with one tiny thing you can do every day."
          action={<Button onClick={openNew}>Add your first habit</Button>}
        />
      ) : (
        <div className="space-y-4">
          {habits.rows.map((h) => {
            const s = streak(h.id);
            const { done, target } = monthProgress(h);
            const pct = target ? Math.round((done / target) * 100) : 0;
            const color = h.color ?? 'var(--accent)';
            return (
              <Card key={h.id} className="p-4">
                <div className="flex items-center gap-3">
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg"
                    style={{ backgroundColor: `color-mix(in srgb, ${color} 18%, transparent)` }}
                  >
                    {h.icon ?? '✨'}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-text-primary">{h.name}</p>
                    <p className="flex items-center gap-2 text-xs text-text-secondary">
                      <span className="flex items-center gap-1">
                        <Flame size={12} /> {s}d
                      </span>
                      {h.reminder_time && (
                        <span className="flex items-center gap-1">
                          <Bell size={11} /> {h.reminder_time.slice(0, 5)}
                        </span>
                      )}
                      <span className="capitalize">{h.frequency_type}</span>
                    </p>
                  </div>
                  <button
                    onClick={() => openEdit(h)}
                    aria-label={`Edit ${h.name}`}
                    className="rounded-full p-2 text-text-secondary transition-colors hover:text-[var(--accent)]"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    onClick={() => habits.remove(h.id)}
                    aria-label={`Delete ${h.name}`}
                    className="rounded-full p-2 text-text-secondary transition-colors hover:text-[var(--danger)]"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>

                {/* monthly progress */}
                <div className="mt-3 flex items-center gap-2">
                  <div className="flex-1">
                    <ProgressBar value={pct} />
                  </div>
                  <span className="shrink-0 text-xs text-text-secondary">
                    {done}/{target}
                  </span>
                </div>

                {/* calendar grid — compact, like the home-page calendar */}
                <div className="mt-3 max-w-[20rem]">
                  <div className="mb-1 grid grid-cols-7 justify-items-center gap-1.5">
                    {WEEKDAYS.map((w, i) => (
                      <span key={i} className="text-center text-[10px] font-medium text-text-secondary">
                        {w}
                      </span>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 justify-items-center gap-1.5">
                    {Array.from({ length: startWeekday }).map((_, i) => (
                      <span key={`pad-${i}`} />
                    ))}
                    {days.map((iso) => {
                      const done = !!logFor(h.id, iso)?.completed;
                      const target = isTargetDay(h, iso);
                      const future = iso > today;
                      const isToday = iso === today;
                      return (
                        <button
                          key={iso}
                          onClick={() => toggle(h.id, iso)}
                          disabled={future}
                          title={iso}
                          aria-label={`${h.name} on ${iso}`}
                          className="flex h-7 w-7 items-center justify-center rounded-md text-[10px] transition-all disabled:cursor-not-allowed disabled:opacity-30"
                          style={{
                            backgroundColor: done ? color : 'var(--bg-secondary)',
                            opacity: done ? 1 : target ? 0.7 : 0.3,
                            outline: isToday ? `2px solid ${color}` : 'none',
                            outlineOffset: 1,
                          }}
                        >
                          {done ? <Check size={11} className="text-white" /> : (
                            <span className="text-text-secondary">{Number(iso.slice(8))}</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={draft.id ? 'Edit habit' : 'New habit'}>
        <div className="flex flex-col gap-4">
          <Input
            name="habit"
            label="What's the habit?"
            placeholder="Drink water, read 10 pages..."
            value={draft.name}
            onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
          />

          <div>
            <p className="mb-2 text-xs font-medium text-text-secondary">Icon</p>
            <div className="flex flex-wrap gap-2">
              {EMOJIS.map((e) => (
                <button
                  key={e}
                  onClick={() => setDraft((d) => ({ ...d, icon: e }))}
                  className="flex h-9 w-9 items-center justify-center rounded-full border text-lg transition-all"
                  style={{
                    borderColor: draft.icon === e ? 'var(--accent)' : 'var(--border)',
                    backgroundColor: draft.icon === e ? 'var(--accent-light)' : 'transparent',
                  }}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-medium text-text-secondary">Colour</p>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setDraft((d) => ({ ...d, color: c }))}
                  aria-label={`Colour ${c}`}
                  className="h-7 w-7 rounded-full transition-transform"
                  style={{
                    backgroundColor: c,
                    transform: draft.color === c ? 'scale(1.15)' : 'scale(1)',
                    outline: draft.color === c ? '2px solid var(--text-primary)' : 'none',
                    outlineOffset: 2,
                  }}
                />
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-medium text-text-secondary">Frequency</p>
            <div className="flex flex-wrap gap-2">
              {FREQ_OPTIONS.map((f) => (
                <Chip
                  key={f.value}
                  active={draft.frequency_type === f.value}
                  onClick={() => setDraft((d) => ({ ...d, frequency_type: f.value }))}
                >
                  {f.label}
                </Chip>
              ))}
            </div>
            {draft.frequency_type !== 'daily' && (
              <div className="mt-2 flex gap-1.5">
                {WEEKDAYS.map((w, i) => (
                  <button
                    key={i}
                    onClick={() => toggleDay(i)}
                    className="flex h-8 w-8 items-center justify-center rounded-full border text-xs transition-all"
                    style={{
                      borderColor: draft.frequency_days.includes(i) ? 'var(--accent)' : 'var(--border)',
                      backgroundColor: draft.frequency_days.includes(i) ? 'var(--accent)' : 'transparent',
                      color: draft.frequency_days.includes(i) ? '#fff' : 'var(--text-secondary)',
                    }}
                  >
                    {w}
                  </button>
                ))}
              </div>
            )}
          </div>

          <Input
            name="reminder"
            type="time"
            label="Reminder (optional)"
            value={draft.reminder_time}
            onChange={(e) => setDraft((d) => ({ ...d, reminder_time: e.target.value }))}
          />

          <Button onClick={save} loading={saving} disabled={!draft.name.trim()} className="w-full">
            {draft.id ? 'Save changes' : 'Add habit'}
          </Button>
        </div>
      </Modal>
    </>
  );
}

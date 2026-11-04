'use client';

import { useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { useRows } from '@/lib/hooks/useRows';
import { useSupabase } from '@/components/providers/SupabaseProvider';
import { writer } from '@/lib/supabase/write';
import type { Mood } from '@/lib/supabase/types';
import { todayISO, prettyDate, toISODate } from '@/lib/utils/date';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Spinner } from '@/components/ui/Spinner';

const SCORE: Record<Mood, number> = { happy: 5, blessed: 4, mid: 3, anxious: 2, sad: 1 };

const MOODS: { key: Mood; emoji: string; label: string }[] = [
  { key: 'happy', emoji: '😄', label: 'Happy' },
  { key: 'blessed', emoji: '🥰', label: 'Blessed' },
  { key: 'mid', emoji: '😌', label: 'Mid' },
  { key: 'anxious', emoji: '😰', label: 'Anxious' },
  { key: 'sad', emoji: '😢', label: 'Sad' },
];

export function MoodView() {
  const { supabase, user } = useSupabase();
  const { rows, loading, refresh } = useRows('mood_log', { orderBy: 'date', ascending: false });
  const [saving, setSaving] = useState(false);

  const today = todayISO();
  const todayMood = useMemo(() => rows.find((r) => r.date === today), [rows, today]);

  async function pick(mood: Mood) {
    if (!user) return;
    setSaving(true);
    if (todayMood) {
      await writer(supabase, 'mood_log').update({ mood }).eq('id', todayMood.id);
    } else {
      await writer(supabase, 'mood_log').insert({ user_id: user.id, date: today, mood });
    }
    await refresh();
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    );
  }

  // 14-day mood trend for the line chart.
  const trend: { date: string; score: number }[] = [];
  for (let i = 13; i >= 0; i -= 1) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const iso = toISODate(d);
    const m = rows.find((r) => r.date === iso);
    trend.push({ date: d.toLocaleDateString(undefined, { day: 'numeric' }), score: m ? SCORE[m.mood] : 0 });
  }
  const hasTrend = trend.some((t) => t.score > 0);

  return (
    <>
      <PageHeader title="Mood" subtitle="no wrong answer. just checking in." />

      <Card className="mb-5">
        <p className="text-sm text-text-secondary">How are you today?</p>
        <div className="mt-4 flex flex-wrap justify-between gap-2">
          {MOODS.map((m) => (
            <button
              key={m.key}
              onClick={() => pick(m.key)}
              disabled={saving}
              aria-pressed={todayMood?.mood === m.key}
              className="flex flex-1 flex-col items-center gap-1 rounded-[var(--radius)] border px-2 py-3 transition-all"
              style={{
                borderColor: todayMood?.mood === m.key ? 'var(--accent)' : 'var(--border)',
                backgroundColor: todayMood?.mood === m.key ? 'var(--accent-light)' : 'transparent',
              }}
            >
              <span className="text-2xl">{m.emoji}</span>
              <span className="text-[11px] text-text-secondary">{m.label}</span>
            </button>
          ))}
        </div>
      </Card>

      {hasTrend && (
        <Card className="mb-5">
          <p className="mb-2 text-sm font-medium text-text-primary">Last 14 days</p>
          <div style={{ width: '100%', height: 140 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend} margin={{ top: 6, right: 6, bottom: 0, left: -28 }}>
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} />
                <YAxis domain={[0, 5]} ticks={[1, 3, 5]} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} />
                <Tooltip
                  formatter={(value) => [Number(value) === 0 ? 'no entry' : `${value}/5`, 'mood']}
                  contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 12 }}
                />
                <Line type="monotone" dataKey="score" stroke="var(--accent)" strokeWidth={2.5} dot={{ r: 3, fill: 'var(--accent)' }} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}
      {rows.length === 0 ? (
        <EmptyState emoji="📓" title="No history yet" hint="Check in daily and you'll see the shape of your weeks." />
      ) : (
        <div className="space-y-2">
          {rows.map((r) => {
            const m = MOODS.find((x) => x.key === r.mood);
            return (
              <Card key={r.id} className="flex items-center gap-3 p-3.5">
                <span className="text-2xl">{m?.emoji}</span>
                <div className="flex-1">
                  <p className="text-sm text-text-primary">{m?.label}</p>
                  <p className="text-xs text-text-secondary">{prettyDate(r.date)}</p>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}

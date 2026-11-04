'use client';

import { useEffect, useState } from 'react';
import { Lock } from 'lucide-react';
import { useSupabase } from '@/components/providers/SupabaseProvider';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { BADGES, type Stats } from '@/lib/achievements';

export function AchievementsView() {
  const { supabase, user } = useSupabase();
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const [habits, habitLogs, tasksDone, journal, study, moods, goals] = await Promise.all([
        supabase.from('habits').select('*', { count: 'exact', head: true }),
        supabase.from('habit_logs').select('*', { count: 'exact', head: true }).eq('completed', true),
        supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('completed', true),
        supabase.from('journal_entries').select('*', { count: 'exact', head: true }),
        supabase.from('study_sessions').select('*'),
        supabase.from('mood_log').select('*', { count: 'exact', head: true }),
        supabase.from('goals').select('*', { count: 'exact', head: true }),
      ]);
      const studyRows = (study.data ?? []) as { duration_mins: number | null }[];
      const studyMins = studyRows.reduce((sum, r) => sum + (r.duration_mins ?? 0), 0);
      if (!cancelled) {
        setStats({
          habits: habits.count ?? 0,
          habitLogs: habitLogs.count ?? 0,
          tasksDone: tasksDone.count ?? 0,
          journal: journal.count ?? 0,
          studyMins,
          moods: moods.count ?? 0,
          goals: goals.count ?? 0,
        });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase, user]);

  if (!stats) {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    );
  }

  const unlockedCount = BADGES.filter((b) => b.unlocked(stats)).length;

  return (
    <>
      <PageHeader
        title="Wins"
        subtitle={`${unlockedCount} of ${BADGES.length} unlocked. proud of you.`}
      />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {BADGES.map((b) => {
          const got = b.unlocked(stats);
          return (
            <Card
              key={b.key}
              className="flex flex-col items-center p-4 text-center transition-all"
              style={{ opacity: got ? 1 : 0.55 }}
            >
              <span className="relative text-4xl" aria-hidden>
                {got ? b.emoji : <Lock className="text-text-secondary" size={32} />}
              </span>
              <p className="mt-2 text-sm font-medium text-text-primary">{b.title}</p>
              <p className="mt-0.5 text-xs text-text-secondary">{b.hint}</p>
            </Card>
          );
        })}
      </div>
    </>
  );
}

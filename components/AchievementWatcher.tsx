'use client';

import { useEffect, useRef } from 'react';
import { useSupabase } from '@/components/providers/SupabaseProvider';
import { writer } from '@/lib/supabase/write';
import { useToast } from '@/components/ui/Toast';
import { BADGES, BADGE_MAP, earnedKeys, type Stats } from '@/lib/achievements';
import { celebrate } from '@/lib/confetti';

/** Runs once per app mount: computes the user's stats, compares against the
 *  achievements they've already unlocked, and unlocks + toasts anything new.
 *  Renders nothing. */
export function AchievementWatcher() {
  const { supabase, user } = useSupabase();
  const { show } = useToast();
  const ran = useRef(false);

  useEffect(() => {
    if (!user || ran.current) return;
    ran.current = true;

    (async () => {
      const [habits, habitLogs, tasksDone, journal, study, moods, goals, existing] =
        await Promise.all([
          supabase.from('habits').select('*', { count: 'exact', head: true }),
          supabase.from('habit_logs').select('*', { count: 'exact', head: true }).eq('completed', true),
          supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('completed', true),
          supabase.from('journal_entries').select('*', { count: 'exact', head: true }),
          supabase.from('study_sessions').select('duration_mins'),
          supabase.from('mood_log').select('*', { count: 'exact', head: true }),
          supabase.from('goals').select('*', { count: 'exact', head: true }).eq('completed', true),
          supabase.from('achievements').select('badge_key'),
        ]);

      const studyRows = (study.data ?? []) as { duration_mins: number | null }[];
      const studyMins = studyRows.reduce((sum, r) => sum + (r.duration_mins ?? 0), 0);

      const stats: Stats = {
        habits: habits.count ?? 0,
        habitLogs: habitLogs.count ?? 0,
        tasksDone: tasksDone.count ?? 0,
        journal: journal.count ?? 0,
        studyMins,
        moods: moods.count ?? 0,
        goals: goals.count ?? 0,
      };

      const have = new Set(
        ((existing.data ?? []) as { badge_key: string }[]).map((r) => r.badge_key)
      );
      const newly = earnedKeys(stats).filter((k) => !have.has(k));
      if (newly.length === 0) return;

      for (const key of newly) {
        await writer(supabase, 'achievements').insert({ user_id: user.id, badge_key: key });
        const b = BADGE_MAP.get(key);
        if (b) show({ emoji: b.emoji, title: 'Achievement unlocked!', body: b.title });
      }
      celebrate();
    })();
    // BADGES referenced only to keep the dependency explicit for linters.
    void BADGES;
  }, [user, supabase, show]);

  return null;
}

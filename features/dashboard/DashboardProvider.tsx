'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useRows } from '@/lib/hooks/useRows';
import { useSupabase } from '@/components/providers/SupabaseProvider';
import { writer } from '@/lib/supabase/write';
import { todayISO, toISODate } from '@/lib/utils/date';
import { celebrate } from '@/lib/confetti';
import type { Mood } from '@/lib/supabase/types';

export const MOODS: { key: Mood; emoji: string; score: number; label: string }[] = [
  { key: 'happy', emoji: '😄', score: 5, label: 'Happy' },
  { key: 'blessed', emoji: '🥰', score: 4, label: 'Blessed' },
  { key: 'mid', emoji: '😌', score: 3, label: 'Okay' },
  { key: 'anxious', emoji: '😰', score: 2, label: 'Anxious' },
  { key: 'sad', emoji: '😢', score: 1, label: 'Low' },
];

export const money = (n: number) =>
  `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

type Ctx = ReturnType<typeof useDashboardData>;

const DashboardContext = createContext<Ctx | null>(null);

/** Loads every table the dashboard widgets need — once — and exposes derived
 *  values + write actions. Centralising the fetch here means we open one
 *  realtime channel per table instead of one per widget. */
function useDashboardData() {
  const { supabase, user } = useSupabase();
  const today = todayISO();

  const habits = useRows('habits', { orderBy: 'created_at' });
  const habitLogs = useRows('habit_logs', { realtime: true });
  const tasks = useRows('tasks', { orderBy: 'position', realtime: true });
  const goals = useRows('goals', {});
  const water = useRows('health_water', { realtime: true });
  const income = useRows('finance_income', {});
  const expenses = useRows('finance_expenses', {});
  const bills = useRows('finance_bills', {});
  const moods = useRows('mood_log', {});
  const media = useRows('media', {});
  const study = useRows('study_sessions', {});
  const vision = useRows('vision_board', {});
  const notes = useRows('notes', { orderBy: 'created_at', ascending: false });
  const journal = useRows('journal_entries', { orderBy: 'created_at', ascending: false });

  const refreshAll = useCallback(async () => {
    await Promise.all([
      habits.refresh(),
      habitLogs.refresh(),
      tasks.refresh(),
      goals.refresh(),
      water.refresh(),
      income.refresh(),
      expenses.refresh(),
      bills.refresh(),
      moods.refresh(),
      media.refresh(),
      study.refresh(),
      vision.refresh(),
      notes.refresh(),
      journal.refresh(),
    ]);
  }, [habits, habitLogs, tasks, goals, water, income, expenses, bills, moods, media, study, vision, notes, journal]);

  useEffect(() => {
    function onVanillaSaved() {
      void refreshAll();
    }
    window.addEventListener('vanilla:data-saved', onVanillaSaved);
    return () => window.removeEventListener('vanilla:data-saved', onVanillaSaved);
  }, [refreshAll]);

  const doneToday = useMemo(() => {
    const set = new Set<string>();
    habitLogs.rows.forEach((l) => {
      if (l.date === today && l.completed) set.add(l.habit_id);
    });
    return set;
  }, [habitLogs.rows, today]);

  const habitsDone = habits.rows.filter((h) => doneToday.has(h.id)).length;
  const habitPct = habits.rows.length
    ? Math.round((habitsDone / habits.rows.length) * 100)
    : 0;

  // Celebrate the moment every habit is ticked off (once per "all done").
  const celebrated = useRef(false);
  useEffect(() => {
    if (habits.rows.length > 0 && habitsDone === habits.rows.length) {
      if (!celebrated.current) {
        celebrated.current = true;
        celebrate();
      }
    } else {
      celebrated.current = false;
    }
  }, [habitsDone, habits.rows.length]);

  const todayWater = water.rows.find((r) => r.date === today);
  const todayMood = moods.rows.find((r) => r.date === today);

  // Longest current streak across all habits.
  const longestStreak = useMemo(() => {
    function streakFor(habitId: string) {
      let count = 0;
      for (let i = 0; ; i += 1) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const iso = toISODate(d);
        const done = habitLogs.rows.some(
          (l) => l.habit_id === habitId && l.date === iso && l.completed
        );
        if (done) count += 1;
        else if (i === 0) continue;
        else break;
      }
      return count;
    }
    let best = 0;
    let name = '';
    habits.rows.forEach((h) => {
      const s = streakFor(h.id);
      if (s > best) {
        best = s;
        name = h.name;
      }
    });
    return { days: best, name };
  }, [habits.rows, habitLogs.rows]);

  const monthKey = today.slice(0, 7);
  const monthIncome = income.rows
    .filter((r) => r.date.slice(0, 7) === monthKey)
    .reduce((s, r) => s + Number(r.amount), 0);
  const monthExpenses = expenses.rows
    .filter((r) => r.date.slice(0, 7) === monthKey)
    .reduce((s, r) => s + Number(r.amount), 0);
  const balance = monthIncome - monthExpenses;
  const spentToday = expenses.rows
    .filter((r) => r.date === today)
    .reduce((s, r) => s + Number(r.amount), 0);

  // 7-day mood scores for the sparkline.
  const moodSpark = useMemo(() => {
    const days: number[] = [];
    for (let i = 6; i >= 0; i -= 1) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const iso = toISODate(d);
      const m = moods.rows.find((r) => r.date === iso);
      days.push(m ? MOODS.find((x) => x.key === m.mood)?.score ?? 0 : 0);
    }
    return days;
  }, [moods.rows]);

  const toggleHabit = useCallback(
    async (habitId: string) => {
      if (!user) return;
      const existing = habitLogs.rows.find(
        (l) => l.habit_id === habitId && l.date === today
      );
      if (existing)
        await writer(supabase, 'habit_logs').delete().eq('id', existing.id);
      else
        await writer(supabase, 'habit_logs').insert({
          user_id: user.id,
          habit_id: habitId,
          date: today,
          completed: true,
        });
      await habitLogs.refresh();
    },
    [supabase, user, habitLogs, today]
  );

  const changeWater = useCallback(
    async (delta: number) => {
      if (!user) return;
      if (todayWater)
        await water.update(todayWater.id, {
          amount_ml: Math.max(0, todayWater.amount_ml + delta),
        });
      else if (delta > 0) {
        await writer(supabase, 'health_water').insert({
          user_id: user.id,
          date: today,
          amount_ml: delta,
          goal_ml: 2500,
        });
        await water.refresh();
      }
    },
    [supabase, user, water, todayWater, today]
  );

  const pickMood = useCallback(
    async (mood: Mood) => {
      if (!user) return;
      if (todayMood)
        await writer(supabase, 'mood_log').update({ mood }).eq('id', todayMood.id);
      else
        await writer(supabase, 'mood_log').insert({
          user_id: user.id,
          date: today,
          mood,
        });
      await moods.refresh();
    },
    [supabase, user, moods, todayMood, today]
  );

  const journaledToday = journal.rows.some((e) => e.created_at.slice(0, 10) === today);

  // "On this day" — a past entry sharing today's month + day, most recent first.
  const memory = useMemo(() => {
    const md = today.slice(5); // MM-DD
    const curYear = today.slice(0, 4);
    return (
      journal.rows.find(
        (e) => e.created_at.slice(5, 10) === md && e.created_at.slice(0, 4) < curYear
      ) ?? null
    );
  }, [journal.rows, today]);

  // Prefer the saved profile name, then auth metadata, then the email prefix.
  const [profileName, setProfileName] = useState<string | null>(null);
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('users_profile')
        .select('name')
        .eq('id', user.id)
        .single();
      const pn = (data as { name: string | null } | null)?.name;
      if (!cancelled && pn && pn.trim()) setProfileName(pn.trim());
    })();
    return () => {
      cancelled = true;
    };
  }, [user, supabase]);

  const metaName = (user?.user_metadata?.name as string | undefined)?.trim();
  const name = metaName || profileName || user?.email?.split('@')[0] || 'Vanilla';

  return {
    today,
    name,
    loading: habits.loading,
    habits,
    habitLogs,
    doneToday,
    habitsDone,
    habitPct,
    tasks,
    goals,
    todayWater,
    todayMood,
    moodSpark,
    longestStreak,
    balance,
    monthIncome,
    monthExpenses,
    spentToday,
    income,
    expenses,
    bills,
    media,
    study,
    vision,
    notes,
    journal,
    journaledToday,
    memory,
    toggleHabit,
    changeWater,
    pickMood,
    refreshAll,
  };
}

export function DashboardProvider({ children }: { children: ReactNode }) {
  const value = useDashboardData();
  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const ctx = useContext(DashboardContext);
  if (!ctx)
    throw new Error('useDashboard must be used inside <DashboardProvider>');
  return ctx;
}

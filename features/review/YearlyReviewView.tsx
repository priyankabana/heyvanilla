'use client';

import { useMemo, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Repeat,
  BookOpen,
  GraduationCap,
  Wallet,
  Smile,
  Target,
  Clapperboard,
  PenLine,
} from 'lucide-react';
import { BarChart, Bar, XAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts';
import { useRows } from '@/lib/hooks/useRows';
import { MOODS } from '@/features/dashboard/DashboardProvider';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { PageSkeleton } from '@/components/ui/Skeleton';
import { monthName } from '@/lib/utils/date';

const money = (n: number) => `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

function StatCard({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
}) {
  return (
    <Card className="flex flex-col items-center justify-center p-5 text-center">
      <span className="text-[var(--accent)]">{icon}</span>
      <p className="mt-2 text-2xl font-bold text-text-primary">{value}</p>
      <p className="text-xs text-text-secondary">{label}</p>
    </Card>
  );
}

export function YearlyReviewView() {
  const habitLogs = useRows('habit_logs', {});
  const journal = useRows('journal_entries', {});
  const study = useRows('study_sessions', {});
  const expenses = useRows('finance_expenses', {});
  const moods = useRows('mood_log', {});
  const media = useRows('media', {});
  const goals = useRows('goals', {});

  const [year, setYear] = useState(new Date().getFullYear());
  const ys = `${year}`;

  const loading =
    habitLogs.loading || journal.loading || study.loading || expenses.loading || moods.loading;

  const stats = useMemo(() => {
    const habitDays = habitLogs.rows.filter((l) => l.completed && l.date.startsWith(ys)).length;
    const journalCount = journal.rows.filter((e) => e.created_at.startsWith(ys)).length;
    const studyMins = study.rows
      .filter((s) => s.date.startsWith(ys))
      .reduce((sum, s) => sum + (s.duration_mins ?? 0), 0);
    const spent = expenses.rows
      .filter((e) => e.date.startsWith(ys))
      .reduce((sum, e) => sum + Number(e.amount), 0);

    const yearMoods = moods.rows.filter((m) => m.date.startsWith(ys));
    const moodAvg = yearMoods.length
      ? yearMoods.reduce((sum, m) => sum + (MOODS.find((x) => x.key === m.mood)?.score ?? 0), 0) /
        yearMoods.length
      : 0;
    const closestMood = MOODS.reduce((best, m) =>
      Math.abs(m.score - moodAvg) < Math.abs(best.score - moodAvg) ? m : best
    );

    const booksRead = media.rows.filter(
      (m) => m.type === 'book' && (m.status === 'read' || m.status === 'finished')
    ).length;
    const watched = media.rows.filter(
      (m) => (m.type === 'show' || m.type === 'movie') && (m.status === 'watched' || m.status === 'finished')
    ).length;
    const goalsDone = goals.rows.filter((g) => g.completed).length;

    // monthly habit completions
    const monthly = Array.from({ length: 12 }, (_, i) => ({
      month: monthName(i).slice(0, 3),
      count: habitLogs.rows.filter(
        (l) => l.completed && l.date.startsWith(`${ys}-${`${i + 1}`.padStart(2, '0')}`)
      ).length,
    }));

    return {
      habitDays,
      journalCount,
      studyHours: Math.round(studyMins / 60),
      spent,
      moodAvg,
      closestMood,
      booksRead,
      watched,
      goalsDone,
      monthly,
    };
  }, [habitLogs.rows, journal.rows, study.rows, expenses.rows, moods.rows, media.rows, goals.rows, ys]);

  if (loading) return <PageSkeleton />;

  const hasAny =
    stats.habitDays || stats.journalCount || stats.studyHours || stats.spent || stats.goalsDone;

  return (
    <>
      <PageHeader title="Your year" subtitle="the quiet proof that it all added up." />

      {/* year selector */}
      <div className="mb-5 flex items-center justify-center gap-4">
        <button
          onClick={() => setYear((y) => y - 1)}
          aria-label="Previous year"
          className="rounded-full border border-border bg-white/30 p-2 text-text-secondary transition-colors hover:text-[var(--accent)]"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="min-w-[5rem] text-center text-lg font-semibold text-text-primary">{year}</span>
        <button
          onClick={() => setYear((y) => y + 1)}
          disabled={year >= new Date().getFullYear()}
          aria-label="Next year"
          className="rounded-full border border-border bg-white/30 p-2 text-text-secondary transition-colors hover:text-[var(--accent)] disabled:opacity-30"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {!hasAny ? (
        <Card className="p-8 text-center">
          <p className="text-3xl">🌱</p>
          <p className="mt-2 text-sm text-text-primary">Nothing logged for {year} yet.</p>
          <p className="text-xs text-text-secondary">Live a little, log a little — this page fills itself in.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard icon={<Repeat size={20} />} value={`${stats.habitDays}`} label="habit days" />
            <StatCard icon={<PenLine size={20} />} value={`${stats.journalCount}`} label="journal entries" />
            <StatCard icon={<GraduationCap size={20} />} value={`${stats.studyHours}h`} label="studied" />
            <StatCard icon={<Wallet size={20} />} value={money(stats.spent)} label="spent" />
            <StatCard icon={<Smile size={20} />} value={stats.closestMood.emoji} label={`avg mood · ${stats.closestMood.label.toLowerCase()}`} />
            <StatCard icon={<BookOpen size={20} />} value={`${stats.booksRead}`} label="books read" />
            <StatCard icon={<Clapperboard size={20} />} value={`${stats.watched}`} label="watched" />
            <StatCard icon={<Target size={20} />} value={`${stats.goalsDone}`} label="goals reached" />
          </div>

          <Card>
            <p className="mb-3 text-sm font-medium text-text-primary">Habit completions by month</p>
            <div style={{ height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.monthly}>
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11, fill: 'var(--text-secondary)' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: 'var(--accent-light)', opacity: 0.3 }}
                    contentStyle={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border)',
                      borderRadius: '0.75rem',
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {stats.monthly.map((_, i) => (
                      <Cell key={i} fill="var(--accent)" />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}

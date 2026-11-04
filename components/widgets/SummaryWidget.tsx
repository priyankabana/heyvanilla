'use client';

import { Sun } from 'lucide-react';
import { useDashboard, MOODS, money } from '@/features/dashboard/DashboardProvider';
import { WidgetShell } from './WidgetShell';

/** The "today, in one line" card the spec asks for: habits done, whether you
 *  journaled, what you spent, and how you felt. */
export function SummaryWidget() {
  const { habits, habitsDone, journaledToday, spentToday, todayMood } = useDashboard();
  const moodEmoji = todayMood ? MOODS.find((m) => m.key === todayMood.mood)?.emoji : null;

  const parts: string[] = [];
  if (habits.rows.length) parts.push(`${habitsDone}/${habits.rows.length} habits`);
  parts.push(journaledToday ? 'journaled ✍️' : 'not journaled yet');
  parts.push(`${money(spentToday)} spent`);

  return (
    <WidgetShell icon={<Sun size={16} />} title="Today at a glance">
      <div className="flex h-full flex-col justify-center">
        <p className="text-sm leading-relaxed text-text-primary">
          You&apos;ve done{' '}
          <span className="font-semibold text-[var(--accent)]">{habitsDone}</span>
          {habits.rows.length ? ` of ${habits.rows.length}` : ''} habit
          {habits.rows.length === 1 ? '' : 's'},{' '}
          {journaledToday ? 'written in your journal' : 'not journaled yet'}, and spent{' '}
          <span className="font-semibold text-[var(--accent)]">{money(spentToday)}</span> today
          {moodEmoji ? ` — feeling ${moodEmoji}` : ''}.
        </p>
        <p className="mt-3 text-xs text-text-secondary">
          {habits.rows.length && habitsDone === habits.rows.length
            ? 'every habit done. proud of you. 🤍'
            : 'gentle nudge — you’ve still got time.'}
        </p>
      </div>
    </WidgetShell>
  );
}

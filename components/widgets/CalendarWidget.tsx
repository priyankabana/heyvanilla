'use client';

import { useMemo, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { useDashboard } from '@/features/dashboard/DashboardProvider';
import { WidgetShell } from './WidgetShell';
import { monthGrid, monthName } from '@/lib/utils/date';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

/** A soft month-at-a-glance calendar. Days with a task due, a habit ticked, or a
 *  journal entry get a little accent dot, so the month reads as "how full" it
 *  was without opening anything. */
export function CalendarWidget() {
  const { tasks, habitLogs, journal, today } = useDashboard();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  const { days, startWeekday } = useMemo(() => monthGrid(year, month), [year, month]);

  const active = useMemo(() => {
    const set = new Set<string>();
    tasks.rows.forEach((t) => t.due_date && set.add(t.due_date));
    habitLogs.rows.forEach((l) => l.completed && set.add(l.date));
    journal.rows.forEach((e) => set.add(e.created_at.slice(0, 10)));
    return set;
  }, [tasks.rows, habitLogs.rows, journal.rows]);

  function step(dir: number) {
    let m = month + dir;
    let y = year;
    if (m < 0) {
      m = 11;
      y -= 1;
    } else if (m > 11) {
      m = 0;
      y += 1;
    }
    setMonth(m);
    setYear(y);
  }

  return (
    <WidgetShell icon={<CalendarDays size={16} />} title="Calendar">
      <div className="mb-2 flex items-center justify-between">
        <button
          onClick={() => step(-1)}
          aria-label="Previous month"
          className="rounded-full p-1 text-text-secondary transition-colors hover:text-[var(--accent)]"
        >
          <ChevronLeft size={15} />
        </button>
        <span className="text-xs font-medium text-text-primary">
          {monthName(month)} {year}
        </span>
        <button
          onClick={() => step(1)}
          aria-label="Next month"
          className="rounded-full p-1 text-text-secondary transition-colors hover:text-[var(--accent)]"
        >
          <ChevronRight size={15} />
        </button>
      </div>

      <div className="mb-1 grid grid-cols-7 gap-1">
        {WEEKDAYS.map((w, i) => (
          <span key={i} className="text-center text-[10px] font-medium text-text-secondary">
            {w}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: startWeekday }).map((_, i) => (
          <span key={`pad-${i}`} />
        ))}
        {days.map((iso) => {
          const isToday = iso === today;
          const isActive = active.has(iso);
          return (
            <div
              key={iso}
              className="relative flex aspect-square items-center justify-center rounded-md text-[11px]"
              style={{
                backgroundColor: isToday ? 'var(--accent)' : 'transparent',
                color: isToday ? '#fff' : 'var(--text-primary)',
                fontWeight: isToday ? 600 : 400,
              }}
            >
              {Number(iso.slice(8))}
              {isActive && !isToday && (
                <span
                  className="absolute bottom-0.5 h-1 w-1 rounded-full"
                  style={{ backgroundColor: 'var(--accent)' }}
                />
              )}
            </div>
          );
        })}
      </div>
    </WidgetShell>
  );
}

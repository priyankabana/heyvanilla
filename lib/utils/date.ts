// Small date helpers. Everything stores dates as YYYY-MM-DD strings to match
// the Postgres `date` columns, so we keep the conversion in one place.

export function todayISO(): string {
  const d = new Date();
  return toISODate(d);
}

export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function prettyDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export function greeting(): { text: string; emoji: string } {
  const h = new Date().getHours();
  if (h < 12) return { text: 'Good morning', emoji: '☀️' };
  if (h < 18) return { text: 'Good afternoon', emoji: '🌤️' };
  return { text: 'Good evening', emoji: '🌙' };
}

// Days in the current month, as ISO strings, plus the weekday the 1st lands on.
export function monthGrid(year: number, monthIndex: number) {
  const first = new Date(year, monthIndex, 1);
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const days: string[] = [];
  for (let i = 1; i <= daysInMonth; i += 1) {
    days.push(toISODate(new Date(year, monthIndex, i)));
  }
  return { days, startWeekday: first.getDay(), daysInMonth };
}

export function monthName(monthIndex: number): string {
  return new Date(2000, monthIndex, 1).toLocaleDateString(undefined, {
    month: 'long',
  });
}

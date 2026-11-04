'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Plus, Trash2, Play, Square, Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts';
import { useRows } from '@/lib/hooks/useRows';
import { todayISO, prettyDate } from '@/lib/utils/date';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Spinner } from '@/components/ui/Spinner';
import { FocusWidget } from '@/components/widgets/FocusWidget';

function fmt(totalSec: number): string {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${`${s}`.padStart(2, '0')}`;
}

export function StudyView() {
  const { rows, loading, insert, remove } = useRows('study_sessions', { orderBy: 'date', ascending: false });

  // Live timer
  const [running, setRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [subject, setSubject] = useState('');
  const tick = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (running) {
      tick.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    }
    return () => {
      if (tick.current) clearInterval(tick.current);
    };
  }, [running]);

  async function stopAndSave() {
    setRunning(false);
    const mins = Math.round(seconds / 60);
    if (mins >= 1 && subject.trim()) {
      await insert({ subject: subject.trim(), duration_mins: mins, date: todayISO() });
    }
    setSeconds(0);
    setSubject('');
  }

  // Manual log
  const [open, setOpen] = useState(false);
  const [mSubject, setMSubject] = useState('');
  const [mMins, setMMins] = useState('');

  const totalThisWeek = useMemo(() => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return rows
      .filter((r) => new Date(`${r.date}T00:00:00`) >= weekAgo)
      .reduce((s, r) => s + r.duration_mins, 0);
  }, [rows]);

  // Minutes per day for the last 7 days → bar chart.
  const weekly = useMemo(() => {
    const out: { day: string; mins: number }[] = [];
    for (let i = 6; i >= 0; i -= 1) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const iso = `${d.getFullYear()}-${`${d.getMonth() + 1}`.padStart(2, '0')}-${`${d.getDate()}`.padStart(2, '0')}`;
      const mins = rows.filter((r) => r.date === iso).reduce((s, r) => s + r.duration_mins, 0);
      out.push({ day: d.toLocaleDateString(undefined, { weekday: 'short' }).slice(0, 1), mins });
    }
    return out;
  }, [rows]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Study"
        subtitle="focused minutes add up faster than you'd think."
        action={<Button variant="outline" onClick={() => setOpen(true)}><Plus size={16} /> Log</Button>}
      />

      <Card className="mb-5 text-center">
        <p className="text-xs text-text-secondary">Timer</p>
        <p className="my-1 font-mono text-5xl font-semibold text-text-primary">{fmt(seconds)}</p>
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="what are you working on?"
          className="mx-auto mt-2 block w-full max-w-xs rounded-[var(--radius)] border border-border bg-white/40 px-3 py-2 text-center text-sm text-text-primary outline-none focus:border-[var(--accent)]"
        />
        <div className="mt-4 flex justify-center gap-2">
          {!running ? (
            <Button onClick={() => setRunning(true)} disabled={!subject.trim()}><Play size={16} /> Start</Button>
          ) : (
            <Button onClick={stopAndSave}><Square size={16} /> Stop &amp; save</Button>
          )}
        </div>
      </Card>

      {/* Pomodoro — goes full-screen (timer only) when you start it */}
      <div className="mb-5">
        <FocusWidget />
      </div>

      <Card className="mb-5">
        <p className="mb-2 flex items-center gap-2 text-sm font-medium text-text-primary">
          <Clock size={15} className="text-[var(--accent)]" />
          {Math.floor(totalThisWeek / 60)}h {totalThisWeek % 60}m this week
        </p>
        <div style={{ width: '100%', height: 120 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weekly} margin={{ top: 6, right: 0, bottom: 0, left: 0 }}>
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} />
              <Tooltip
                formatter={(value) => [`${value} min`, 'studied']}
                contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 12 }}
                cursor={{ fill: 'var(--border)' }}
              />
              <Bar dataKey="mins" radius={[6, 6, 0, 0]}>
                {weekly.map((_, i) => (
                  <Cell key={i} fill="var(--accent)" />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {rows.length === 0 ? (
        <EmptyState emoji="📚" title="No sessions yet" hint="Start the timer or log one manually." />
      ) : (
        <div className="space-y-2">
          {rows.map((s) => (
            <Card key={s.id} className="flex items-center gap-3 p-3.5">
              <div className="flex-1">
                <p className="text-sm text-text-primary">{s.subject}</p>
                <p className="text-xs text-text-secondary">{prettyDate(s.date)}</p>
              </div>
              <span className="text-sm font-medium text-text-secondary">{s.duration_mins}m</span>
              <button onClick={() => remove(s.id)} aria-label="Delete" className="rounded-full p-1.5 text-text-secondary hover:text-[var(--danger)]"><Trash2 size={15} /></button>
            </Card>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Log a session">
        <div className="flex flex-col gap-4">
          <Input name="subject" label="Subject" placeholder="Algorithms, Spanish..." value={mSubject} onChange={(e) => setMSubject(e.target.value)} />
          <Input name="mins" type="number" inputMode="numeric" label="Minutes" placeholder="45" value={mMins} onChange={(e) => setMMins(e.target.value)} />
          <Button
            onClick={async () => {
              const mins = parseInt(mMins, 10);
              if (mSubject.trim() && mins > 0) {
                await insert({ subject: mSubject.trim(), duration_mins: mins, date: todayISO() });
                setMSubject('');
                setMMins('');
                setOpen(false);
              }
            }}
            disabled={!mSubject.trim() || !mMins}
            className="w-full"
          >
            Save
          </Button>
        </div>
      </Modal>
    </>
  );
}


'use client';

import { useEffect, useState } from 'react';
import { CalendarHeart, Pencil } from 'lucide-react';
import { WidgetShell } from './WidgetShell';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

interface CountdownConfig {
  label: string;
  date: string; // YYYY-MM-DD
}

const STORE_KEY = 'heyvanilla_countdown';
const DEFAULT: CountdownConfig = { label: 'New Year', date: `${new Date().getFullYear() + 1}-01-01` };

/** A configurable "X days until ___" widget. Config lives in localStorage so it
 *  needs no table. Click the pencil to change the event. */
export function CountdownWidget() {
  const [cfg, setCfg] = useState<CountdownConfig>(DEFAULT);
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState('');
  const [date, setDate] = useState('');

  useEffect(() => {
    try {
      const cached = JSON.parse(localStorage.getItem(STORE_KEY) ?? 'null') as CountdownConfig | null;
      if (cached?.date) setCfg(cached);
    } catch {
      /* ignore */
    }
  }, []);

  const days = Math.ceil(
    (new Date(`${cfg.date}T00:00:00`).getTime() - new Date(new Date().toISOString().slice(0, 10) + 'T00:00:00').getTime()) /
      86400000
  );

  function save() {
    if (!label.trim() || !date) return;
    const next = { label: label.trim(), date };
    setCfg(next);
    localStorage.setItem(STORE_KEY, JSON.stringify(next));
    setOpen(false);
  }

  return (
    <>
      <WidgetShell
        icon={<CalendarHeart size={16} />}
        title="Countdown"
        href={undefined}
      >
        <div className="relative flex h-full flex-col items-center justify-center text-center">
          <button
            onClick={() => {
              setLabel(cfg.label);
              setDate(cfg.date);
              setOpen(true);
            }}
            aria-label="Edit countdown"
            className="absolute -top-1 right-0 text-text-secondary transition-colors hover:text-[var(--accent)]"
          >
            <Pencil size={14} />
          </button>
          <p className="text-gradient text-5xl font-bold">{days < 0 ? 0 : days}</p>
          <p className="mt-1 text-xs text-text-secondary">
            {days < 0 ? `${cfg.label} has passed` : `day${days === 1 ? '' : 's'} until ${cfg.label}`}
          </p>
        </div>
      </WidgetShell>

      <Modal open={open} onClose={() => setOpen(false)} title="Set countdown">
        <div className="flex flex-col gap-4">
          <Input
            name="cd-label"
            label="What are you counting down to?"
            placeholder="Trip to Italy, exam, birthday…"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />
          <Input
            name="cd-date"
            type="date"
            label="When?"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <Button onClick={save} disabled={!label.trim() || !date} className="w-full">
            Save
          </Button>
        </div>
      </Modal>
    </>
  );
}

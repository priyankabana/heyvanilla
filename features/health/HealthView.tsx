'use client';

import { useMemo, useState } from 'react';
import { Plus, Trash2, Droplet, Moon, Utensils, Minus } from 'lucide-react';
import { useRows } from '@/lib/hooks/useRows';
import { useSupabase } from '@/components/providers/SupabaseProvider';
import { writer } from '@/lib/supabase/write';
import { todayISO, prettyDate } from '@/lib/utils/date';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { EmptyState } from '@/components/ui/EmptyState';
import { Spinner } from '@/components/ui/Spinner';

type Tab = 'water' | 'sleep' | 'diet';
const STEP = 250;

export function HealthView() {
  const { supabase, user } = useSupabase();
  const water = useRows('health_water', { orderBy: 'date', ascending: false, realtime: true });
  const sleep = useRows('health_sleep', { orderBy: 'date', ascending: false });
  const diet = useRows('health_diet', { orderBy: 'date', ascending: false });

  const [tab, setTab] = useState<Tab>('water');
  const today = todayISO();
  const todayWater = useMemo(() => water.rows.find((r) => r.date === today), [water.rows, today]);

  async function changeWater(delta: number) {
    if (!user) return;
    if (todayWater) {
      const next = Math.max(0, todayWater.amount_ml + delta);
      await water.update(todayWater.id, { amount_ml: next });
    } else if (delta > 0) {
      await writer(supabase, 'health_water').insert({ user_id: user.id, date: today, amount_ml: delta, goal_ml: 2500 });
      await water.refresh();
    }
  }

  const loading = water.loading || sleep.loading || diet.loading;
  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    );
  }

  const amount = todayWater?.amount_ml ?? 0;
  const goal = todayWater?.goal_ml ?? 2500;

  return (
    <>
      <PageHeader title="Health" subtitle="water, rest, food. the basics that hold everything up." />

      <div className="mb-4 flex gap-2">
        <Chip active={tab === 'water'} onClick={() => setTab('water')}>Water</Chip>
        <Chip active={tab === 'sleep'} onClick={() => setTab('sleep')}>Sleep</Chip>
        <Chip active={tab === 'diet'} onClick={() => setTab('diet')}>Food</Chip>
      </div>

      {tab === 'water' && (
        <Card>
          <div className="flex items-center gap-2 text-text-secondary">
            <Droplet size={18} className="text-[var(--accent)]" />
            <span className="text-sm">Today</span>
          </div>
          <p className="mt-2 text-3xl font-semibold text-text-primary">
            {amount}<span className="text-base text-text-secondary"> / {goal} ml</span>
          </p>
          <div className="mt-3"><ProgressBar value={(amount / goal) * 100} /></div>
          <div className="mt-4 flex gap-2">
            <Button onClick={() => changeWater(STEP)}><Plus size={16} /> {STEP}ml</Button>
            <Button variant="outline" onClick={() => changeWater(-STEP)}><Minus size={16} /> {STEP}ml</Button>
          </div>
        </Card>
      )}

      {tab === 'sleep' && <SleepTab rows={sleep.rows} onAdd={sleep.insert} onDelete={sleep.remove} />}
      {tab === 'diet' && <DietTab rows={diet.rows} onAdd={diet.insert} onDelete={diet.remove} />}
    </>
  );
}

function SleepTab({
  rows,
  onAdd,
  onDelete,
}: {
  rows: { id: string; date: string; bedtime: string | null; wake_time: string | null; quality: number | null }[];
  onAdd: (v: { date: string; bedtime: string | null; wake_time: string | null; quality: number | null }) => void;
  onDelete: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [bed, setBed] = useState('23:00');
  const [wake, setWake] = useState('07:00');
  const [quality, setQuality] = useState('4');
  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button onClick={() => setOpen(true)}><Plus size={16} /> Log sleep</Button>
      </div>
      {rows.length === 0 ? (
        <EmptyState emoji="😴" title="No sleep logged" hint="Track a night and patterns start to show." />
      ) : (
        <div className="space-y-2">
          {rows.map((s) => (
            <Card key={s.id} className="flex items-center gap-3 p-3.5">
              <Moon size={16} className="text-[var(--accent)]" />
              <div className="flex-1">
                <p className="text-sm text-text-primary">{s.bedtime} → {s.wake_time}</p>
                <p className="text-xs text-text-secondary">{prettyDate(s.date)} · quality {s.quality}/5</p>
              </div>
              <button onClick={() => onDelete(s.id)} aria-label="Delete" className="rounded-full p-1.5 text-text-secondary hover:text-[var(--danger)]"><Trash2 size={15} /></button>
            </Card>
          ))}
        </div>
      )}
      <Modal open={open} onClose={() => setOpen(false)} title="Log sleep">
        <div className="flex flex-col gap-4">
          <Input name="bed" type="time" label="Bedtime" value={bed} onChange={(e) => setBed(e.target.value)} />
          <Input name="wake" type="time" label="Wake time" value={wake} onChange={(e) => setWake(e.target.value)} />
          <Select name="quality" label="Quality" value={quality} onChange={(e) => setQuality(e.target.value)} options={[1, 2, 3, 4, 5].map((n) => ({ value: String(n), label: `${n} / 5` }))} />
          <Button onClick={() => { onAdd({ date: todayISO(), bedtime: bed, wake_time: wake, quality: Number(quality) }); setOpen(false); }} className="w-full">Save</Button>
        </div>
      </Modal>
    </>
  );
}

function DietTab({
  rows,
  onAdd,
  onDelete,
}: {
  rows: { id: string; date: string; meal_type: string | null; food_name: string | null }[];
  onAdd: (v: { date: string; meal_type: string; food_name: string }) => void;
  onDelete: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [meal, setMeal] = useState('breakfast');
  const [food, setFood] = useState('');
  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button onClick={() => setOpen(true)}><Plus size={16} /> Log meal</Button>
      </div>
      {rows.length === 0 ? (
        <EmptyState emoji="🍲" title="No meals logged" hint="Jot down what you ate, no calorie counting required." />
      ) : (
        <div className="space-y-2">
          {rows.map((d) => (
            <Card key={d.id} className="flex items-center gap-3 p-3.5">
              <Utensils size={16} className="text-[var(--accent)]" />
              <div className="flex-1">
                <p className="text-sm text-text-primary">{d.food_name}</p>
                <p className="text-xs capitalize text-text-secondary">{d.meal_type} · {prettyDate(d.date)}</p>
              </div>
              <button onClick={() => onDelete(d.id)} aria-label="Delete" className="rounded-full p-1.5 text-text-secondary hover:text-[var(--danger)]"><Trash2 size={15} /></button>
            </Card>
          ))}
        </div>
      )}
      <Modal open={open} onClose={() => setOpen(false)} title="Log meal">
        <div className="flex flex-col gap-4">
          <Select name="meal" label="Meal" value={meal} onChange={(e) => setMeal(e.target.value)} options={[{ value: 'breakfast', label: 'Breakfast' }, { value: 'lunch', label: 'Lunch' }, { value: 'dinner', label: 'Dinner' }, { value: 'snack', label: 'Snack' }]} />
          <Input name="food" label="What did you eat?" placeholder="Oats and berries..." value={food} onChange={(e) => setFood(e.target.value)} />
          <Button onClick={() => { if (food.trim()) { onAdd({ date: todayISO(), meal_type: meal, food_name: food.trim() }); setFood(''); setOpen(false); } }} disabled={!food.trim()} className="w-full">Save</Button>
        </div>
      </Modal>
    </>
  );
}

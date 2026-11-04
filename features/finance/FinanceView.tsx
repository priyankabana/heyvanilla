'use client';

import { useMemo, useState } from 'react';
import { Plus, Trash2, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useRows } from '@/lib/hooks/useRows';
import { todayISO, prettyDate } from '@/lib/utils/date';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { EmptyState } from '@/components/ui/EmptyState';
import { Spinner } from '@/components/ui/Spinner';

type Tab = 'expenses' | 'income' | 'bills';
const money = (n: number) => `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
const thisMonth = (iso: string) => iso.slice(0, 7) === todayISO().slice(0, 7);

export function FinanceView() {
  const expenses = useRows('finance_expenses', { orderBy: 'date', ascending: false });
  const income = useRows('finance_income', { orderBy: 'date', ascending: false });
  const bills = useRows('finance_bills', { orderBy: 'due_date' });

  const [tab, setTab] = useState<Tab>('expenses');
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  // shared form fields
  const [label, setLabel] = useState('');
  const [amount, setAmount] = useState('');

  const totals = useMemo(() => {
    const inc = income.rows.filter((r) => thisMonth(r.date)).reduce((s, r) => s + Number(r.amount), 0);
    const exp = expenses.rows.filter((r) => thisMonth(r.date)).reduce((s, r) => s + Number(r.amount), 0);
    return { inc, exp, balance: inc - exp };
  }, [income.rows, expenses.rows]);

  const loading = expenses.loading || income.loading || bills.loading;

  // Expense breakdown by category (this month) for the donut.
  const byCategory = useMemo(() => {
    const map = new Map<string, number>();
    expenses.rows.filter((r) => thisMonth(r.date)).forEach((r) => {
      map.set(r.category, (map.get(r.category) ?? 0) + Number(r.amount));
    });
    return Array.from(map, ([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [expenses.rows]);

  const PIE_COLORS = ['var(--accent)', 'var(--accent-light)', 'var(--accent-dark)', 'var(--warning)', 'var(--success)', 'var(--text-secondary)'];

  async function add() {
    const amt = parseFloat(amount);
    if (!label.trim() || Number.isNaN(amt)) return;
    setSaving(true);
    if (tab === 'expenses') await expenses.insert({ category: label.trim(), amount: amt, date: todayISO() });
    else if (tab === 'income') await income.insert({ source: label.trim(), amount: amt, date: todayISO() });
    else await bills.insert({ name: label.trim(), amount: amt });
    setSaving(false);
    setLabel('');
    setAmount('');
    setOpen(false);
  }

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
        title="Finance"
        subtitle="where it comes from, where it goes."
        action={
          <Button onClick={() => setOpen(true)}>
            <Plus size={16} /> Add
          </Button>
        }
      />

      <div className="mb-5 grid grid-cols-3 gap-3">
        <Card className="p-4">
          <TrendingUp size={18} className="text-[var(--success)]" />
          <p className="mt-2 text-xs text-text-secondary">Income</p>
          <p className="text-lg font-semibold text-text-primary">{money(totals.inc)}</p>
        </Card>
        <Card className="p-4">
          <TrendingDown size={18} className="text-[var(--danger)]" />
          <p className="mt-2 text-xs text-text-secondary">Spent</p>
          <p className="text-lg font-semibold text-text-primary">{money(totals.exp)}</p>
        </Card>
        <Card className="p-4">
          <Wallet size={18} className="text-[var(--accent)]" />
          <p className="mt-2 text-xs text-text-secondary">Balance</p>
          <p className="text-lg font-semibold" style={{ color: totals.balance >= 0 ? 'var(--success)' : 'var(--danger)' }}>
            {money(totals.balance)}
          </p>
        </Card>
      </div>

      {byCategory.length > 0 && (
        <Card className="mb-5">
          <p className="mb-2 text-sm font-medium text-text-primary">Where it went this month</p>
          <div className="flex items-center gap-4">
            <div style={{ width: 150, height: 150 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={byCategory} dataKey="value" nameKey="name" innerRadius={42} outerRadius={70} paddingAngle={2} stroke="none">
                    {byCategory.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => money(Number(value))}
                    contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="flex-1 space-y-1.5">
              {byCategory.slice(0, 6).map((c, i) => (
                <li key={c.name} className="flex items-center gap-2 text-sm">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                  <span className="flex-1 truncate capitalize text-text-secondary">{c.name}</span>
                  <span className="font-medium text-text-primary">{money(c.value)}</span>
                </li>
              ))}
            </ul>
          </div>
        </Card>
      )}

      <div className="mb-4 flex gap-2">
        <Chip active={tab === 'expenses'} onClick={() => setTab('expenses')}>Expenses</Chip>
        <Chip active={tab === 'income'} onClick={() => setTab('income')}>Income</Chip>
        <Chip active={tab === 'bills'} onClick={() => setTab('bills')}>Bills</Chip>
      </div>

      {tab === 'expenses' && (
        <List
          empty="No expenses logged this month."
          items={expenses.rows.map((r) => ({ id: r.id, title: r.category, sub: prettyDate(r.date), amount: Number(r.amount), color: 'var(--danger)' }))}
          onDelete={expenses.remove}
        />
      )}
      {tab === 'income' && (
        <List
          empty="No income logged yet."
          items={income.rows.map((r) => ({ id: r.id, title: r.source, sub: prettyDate(r.date), amount: Number(r.amount), color: 'var(--success)' }))}
          onDelete={income.remove}
        />
      )}
      {tab === 'bills' && (
        <List
          empty="No bills tracked."
          items={bills.rows.map((r) => ({ id: r.id, title: r.name, sub: r.due_date ? `due ${prettyDate(r.due_date)}` : 'no due date', amount: Number(r.amount), color: 'var(--warning)' }))}
          onDelete={bills.remove}
        />
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={`Add ${tab.slice(0, -1) === 'expense' ? 'expense' : tab === 'income' ? 'income' : 'bill'}`}>
        <div className="flex flex-col gap-4">
          <Input
            name="label"
            label={tab === 'expenses' ? 'Category' : tab === 'income' ? 'Source' : 'Bill name'}
            placeholder={tab === 'expenses' ? 'Groceries, transport...' : tab === 'income' ? 'Salary, freelance...' : 'Rent, phone...'}
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />
          <Input name="amount" type="number" inputMode="decimal" label="Amount (₹)" placeholder="0" value={amount} onChange={(e) => setAmount(e.target.value)} />
          <Button onClick={add} loading={saving} disabled={!label.trim() || !amount} className="w-full">
            Add
          </Button>
        </div>
      </Modal>
    </>
  );
}

function List({
  items,
  empty,
  onDelete,
}: {
  items: { id: string; title: string; sub: string; amount: number; color: string }[];
  empty: string;
  onDelete: (id: string) => void;
}) {
  if (items.length === 0) return <EmptyState emoji="💰" title="Nothing here yet" hint={empty} />;
  return (
    <div className="space-y-2">
      {items.map((it) => (
        <Card key={it.id} className="flex items-center gap-3 p-3.5">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: it.color }} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm text-text-primary">{it.title}</p>
            <p className="text-xs text-text-secondary">{it.sub}</p>
          </div>
          <span className="text-sm font-semibold text-text-primary">
            {`₹${it.amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
          </span>
          <button onClick={() => onDelete(it.id)} aria-label="Delete" className="rounded-full p-1.5 text-text-secondary transition-colors hover:text-[var(--danger)]">
            <Trash2 size={15} />
          </button>
        </Card>
      ))}
    </div>
  );
}

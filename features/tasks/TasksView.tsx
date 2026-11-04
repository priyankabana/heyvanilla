'use client';

import { useMemo, useState } from 'react';
import { Plus, Trash2, Check, GripVertical, Tag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useRows } from '@/lib/hooks/useRows';
import type { Task, TaskPriority } from '@/lib/supabase/types';
import { todayISO, toISODate, prettyDate } from '@/lib/utils/date';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Chip } from '@/components/ui/Chip';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageSkeleton } from '@/components/ui/Skeleton';
import { cn } from '@/lib/utils/cn';

const PRIORITY_COLOR: Record<TaskPriority, string> = {
  low: 'var(--success)',
  medium: 'var(--warning)',
  high: 'var(--danger)',
};

type Filter = 'todo' | 'today' | 'week' | 'overdue' | 'done';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'todo', label: 'To do' },
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'This week' },
  { key: 'overdue', label: 'Overdue' },
  { key: 'done', label: 'Done' },
];

function TaskRow({
  task,
  reorderable,
  onToggle,
  onDelete,
}: {
  task: Task;
  reorderable: boolean;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    disabled: !reorderable,
  });

  return (
    <motion.div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
      className={cn(
        'glass-card card-hover flex items-center gap-2 p-3.5',
        isDragging && 'z-10 opacity-80'
      )}
    >
      {reorderable && (
        <button
          {...attributes}
          {...listeners}
          aria-label="Reorder task"
          className="cursor-grab touch-none text-text-secondary active:cursor-grabbing"
        >
          <GripVertical size={16} />
        </button>
      )}
      <button
        onClick={onToggle}
        aria-label={task.completed ? 'Mark not done' : 'Mark done'}
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all"
        style={{
          borderColor: task.completed ? 'var(--accent)' : 'var(--border)',
          backgroundColor: task.completed ? 'var(--accent)' : 'transparent',
        }}
      >
        {task.completed && <Check size={14} className="text-white" />}
      </button>
      <span
        className="h-2 w-2 shrink-0 rounded-full"
        style={{ backgroundColor: PRIORITY_COLOR[task.priority] }}
        title={`${task.priority} priority`}
      />
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            'truncate text-sm transition-colors',
            task.completed ? 'text-text-secondary line-through' : 'text-text-primary'
          )}
        >
          {task.title}
        </p>
        <p className="flex items-center gap-2 text-xs text-text-secondary">
          {task.due_date && <span>due {prettyDate(task.due_date)}</span>}
          {task.category && (
            <span className="flex items-center gap-0.5">
              <Tag size={10} /> {task.category}
            </span>
          )}
        </p>
      </div>
      <button
        onClick={onDelete}
        aria-label="Delete task"
        className="rounded-full p-2 text-text-secondary transition-colors hover:text-[var(--danger)]"
      >
        <Trash2 size={16} />
      </button>
    </motion.div>
  );
}

export function TasksView() {
  const { rows, loading, insert, update, remove } = useRows('tasks', {
    orderBy: 'position',
    realtime: true,
  });

  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<Filter>('todo');
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [due, setDue] = useState('');
  const [category, setCategory] = useState('');
  const [saving, setSaving] = useState(false);

  const today = todayISO();
  const weekEnd = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return toISODate(d);
  }, []);

  const ordered = useMemo(() => [...rows].sort((a, b) => a.position - b.position), [rows]);

  const visible = useMemo(() => {
    const open = ordered.filter((t) => !t.completed);
    switch (filter) {
      case 'done':
        return ordered.filter((t) => t.completed);
      case 'today':
        return open.filter((t) => t.due_date === today);
      case 'week':
        return open.filter((t) => t.due_date && t.due_date >= today && t.due_date <= weekEnd);
      case 'overdue':
        return open.filter((t) => t.due_date && t.due_date < today);
      default:
        return open;
    }
  }, [ordered, filter, today, weekEnd]);

  const reorderable = filter === 'todo';

  async function add() {
    if (!title.trim()) return;
    setSaving(true);
    const maxPos = rows.reduce((m, t) => Math.max(m, t.position), 0);
    await insert({
      title: title.trim(),
      priority,
      due_date: due || null,
      category: category.trim() || null,
      position: maxPos + 1,
    });
    setSaving(false);
    setTitle('');
    setPriority('medium');
    setDue('');
    setCategory('');
    setOpen(false);
  }

  async function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const ids = visible.map((t) => t.id);
    const oldIndex = ids.indexOf(String(active.id));
    const newIndex = ids.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    const next = arrayMove(visible, oldIndex, newIndex);
    // Persist new positions (only those that changed).
    await Promise.all(
      next.map((t, i) => (t.position === i ? null : update(t.id, { position: i })))
    );
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } })
  );

  if (loading) return <PageSkeleton />;

  return (
    <>
      <PageHeader
        title="Tasks"
        subtitle="one thing at a time. you don't have to do it all today."
        action={
          <Button onClick={() => setOpen(true)}>
            <Plus size={16} /> New
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Chip key={f.key} active={filter === f.key} onClick={() => setFilter(f.key)}>
            {f.label}
          </Chip>
        ))}
      </div>

      {visible.length === 0 ? (
        <EmptyState
          emoji={filter === 'done' ? '📦' : '🎉'}
          title={filter === 'done' ? 'Nothing finished yet' : 'All clear'}
          hint={
            filter === 'done'
              ? 'Tick something off and it shows up here.'
              : 'No tasks in this view. Breathe.'
          }
        />
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={visible.map((t) => t.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              <AnimatePresence initial={false}>
                {visible.map((t) => (
                  <TaskRow
                    key={t.id}
                    task={t}
                    reorderable={reorderable}
                    onToggle={() => update(t.id, { completed: !t.completed })}
                    onDelete={() => remove(t.id)}
                  />
                ))}
              </AnimatePresence>
            </div>
          </SortableContext>
        </DndContext>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="New task">
        <div className="flex flex-col gap-4">
          <Input
            name="title"
            label="Task"
            placeholder="What needs doing?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Select
            name="priority"
            label="Priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value as TaskPriority)}
            options={[
              { value: 'low', label: 'Low' },
              { value: 'medium', label: 'Medium' },
              { value: 'high', label: 'High' },
            ]}
          />
          <Input
            name="category"
            label="Category (optional)"
            placeholder="work, home, study…"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
          <Input
            name="due"
            type="date"
            label="Due date (optional)"
            value={due}
            onChange={(e) => setDue(e.target.value)}
          />
          <Button onClick={add} loading={saving} disabled={!title.trim()} className="w-full">
            Add task
          </Button>
        </div>
      </Modal>
    </>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { LayoutGrid, Check, Plus, EyeOff } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy, arrayMove, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useSupabase } from '@/components/providers/SupabaseProvider';
import { completeSpotifyAuth } from '@/lib/spotify';
import { PageSkeleton } from '@/components/ui/Skeleton';
import { DashboardProvider, useDashboard } from './DashboardProvider';
import { DashboardTopline } from './DashboardTopline';
import { WeeklyHabitsSection } from './WeeklyHabitsSection';
import { WIDGET_MAP } from './widgetRegistry';
import { useWidgetLayout } from './useWidgetLayout';

function SortableWidget({
  id,
  arranging,
  onHide,
  index,
}: {
  id: string;
  arranging: boolean;
  onHide: (key: string) => void;
  index: number;
}) {
  const def = WIDGET_MAP.get(id);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    disabled: !arranging,
  });
  if (!def) return null;
  const Comp = def.Component;

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        ['--reveal-delay' as string]: `${Math.min(index, 12) * 45}ms`,
      }}
      className={`reveal relative ${def.span === 2 ? 'col-span-2' : 'col-span-1'} ${
        isDragging ? 'z-20 opacity-80' : ''
      }`}
    >
      {arranging && (
        <>
          {/* full-card drag surface so the widget's own controls stay inert */}
          <div
            {...attributes}
            {...listeners}
            aria-label={`Drag ${def.label}`}
            className="absolute inset-0 z-20 cursor-grab touch-none rounded-[var(--radius)] active:cursor-grabbing"
          />
          <div className="pointer-events-none absolute inset-0 z-10 rounded-[var(--radius)] ring-2 ring-[var(--accent)]/50" />
          <button
            onClick={() => onHide(id)}
            aria-label={`Hide ${def.label}`}
            className="absolute right-2 top-2 z-30 rounded-full bg-[var(--bg-card)] p-1.5 text-text-secondary shadow-sm backdrop-blur transition-colors hover:text-[var(--danger)]"
          >
            <EyeOff size={14} />
          </button>
        </>
      )}
      <Comp />
    </div>
  );
}

function DashboardInner() {
  const { loading, name } = useDashboard();
  const { supabase } = useSupabase();
  const { visible, hidden, reorder, toggleHidden, reset } = useWidgetLayout();
  const [arranging, setArranging] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } })
  );

  // Finish the Spotify OAuth round-trip if we were sent back with a code.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (!code) return;
    void completeSpotifyAuth(code).finally(() => {
      const url = new URL(window.location.href);
      url.searchParams.delete('code');
      url.searchParams.delete('state');
      window.history.replaceState({}, '', url.pathname + url.search);
    });
  }, [supabase]);

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = visible.indexOf(String(active.id));
    const newIndex = visible.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    const nextVisible = arrayMove(visible, oldIndex, newIndex);
    void reorder([...nextVisible, ...hidden]);
  }

  if (loading) return <PageSkeleton />;

  return (
    <div className="space-y-6">
      {/* TIME + WEATHER — boxless, pinned to the top-right corner */}
      <DashboardTopline />

      {/* MERGED SCHEDULE + HABITS — one weekly tracker, on top */}
      <WeeklyHabitsSection />

      {/* [NAME]'S DAY — heading + arrange controls */}
      <div className="flex items-end justify-between pt-1">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-text-secondary">your space</p>
          <h2
            className="mt-1 text-3xl capitalize text-text-primary"
            style={{ fontFamily: 'var(--font-playfair), serif', fontWeight: 500 }}
          >
            {name}&rsquo;s <span className="text-gradient">day</span>
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {arranging && (
            <button
              onClick={reset}
              className="rounded-full border border-border bg-white/30 px-3 py-1.5 text-xs text-text-secondary transition-colors hover:text-[var(--accent)]"
            >
              Reset
            </button>
          )}
          <button
            onClick={() => setArranging((v) => !v)}
            className="flex items-center gap-1.5 rounded-full border border-border bg-white/30 px-3 py-1.5 text-xs text-text-secondary transition-colors hover:text-[var(--accent)]"
          >
            {arranging ? <Check size={14} /> : <LayoutGrid size={14} />}
            {arranging ? 'Done' : 'Arrange'}
          </button>
        </div>
      </div>
      {arranging && (
        <p className="-mt-3 text-xs text-text-secondary">drag to reorder · hide what you don’t need</p>
      )}

      {/* BENTO GRID — fills wide screens (up to 4 columns) */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={visible} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-2 gap-5 lg:grid-cols-3 xl:grid-cols-4">
            {visible.map((key, i) => (
              <SortableWidget key={key} id={key} index={i} arranging={arranging} onHide={toggleHidden} />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* HIDDEN TRAY (only while arranging) */}
      {arranging && hidden.length > 0 && (
        <div className="glass-card p-4">
          <p className="mb-2 text-xs font-medium text-text-secondary">Hidden widgets</p>
          <div className="flex flex-wrap gap-2">
            {hidden.map((key) => {
              const def = WIDGET_MAP.get(key);
              if (!def) return null;
              return (
                <button
                  key={key}
                  onClick={() => toggleHidden(key)}
                  className="flex items-center gap-1.5 rounded-full border border-border bg-white/30 px-3 py-1.5 text-xs text-text-secondary transition-colors hover:text-[var(--accent)]"
                >
                  <Plus size={13} /> {def.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export function DashboardView() {
  return (
    <DashboardProvider>
      <DashboardInner />
    </DashboardProvider>
  );
}

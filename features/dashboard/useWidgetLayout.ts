'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRows } from '@/lib/hooks/useRows';
import { useSupabase } from '@/components/providers/SupabaseProvider';
import { writer } from '@/lib/supabase/write';
import { DEFAULT_ORDER, WIDGET_MAP } from './widgetRegistry';

const LS_KEY = 'heyvanilla_dashlayout';

interface Layout {
  order: string[];
  hidden: string[];
}

// Drop unknown keys, append any newly-added widgets to the end so the dashboard
// stays valid even as the registry grows.
function sanitize(raw: Partial<Layout> | null): Layout {
  const order = (raw?.order ?? []).filter((k) => WIDGET_MAP.has(k));
  for (const k of DEFAULT_ORDER) if (!order.includes(k)) order.push(k);
  const hidden = (raw?.hidden ?? []).filter((k) => WIDGET_MAP.has(k));
  return { order, hidden };
}

/** Loads/saves the per-user dashboard layout (order + hidden widgets).
 *  Reads localStorage first for an instant paint, then reconciles with the
 *  widget_layout row so the layout follows the user across devices. */
export function useWidgetLayout() {
  const { supabase, user } = useSupabase();
  const rows = useRows('widget_layout', {});
  const [layout, setLayout] = useState<Layout>(() => sanitize(null));

  useEffect(() => {
    try {
      const ls = JSON.parse(localStorage.getItem(LS_KEY) ?? 'null') as Partial<Layout> | null;
      if (ls) setLayout(sanitize(ls));
    } catch {
      /* ignore malformed cache */
    }
  }, []);

  useEffect(() => {
    if (rows.loading) return;
    const row = rows.rows[0];
    if (row?.layout) setLayout(sanitize(row.layout as unknown as Partial<Layout>));
  }, [rows.loading, rows.rows]);

  const persist = useCallback(
    async (next: Layout) => {
      setLayout(next);
      localStorage.setItem(LS_KEY, JSON.stringify(next));
      if (!user) return;
      const row = rows.rows[0];
      if (row)
        await writer(supabase, 'widget_layout')
          .update({ layout: next })
          .eq('id', row.id);
      else {
        await writer(supabase, 'widget_layout').insert({ user_id: user.id, layout: next });
        await rows.refresh();
      }
    },
    [supabase, user, rows]
  );

  const reorder = useCallback((order: string[]) => persist({ ...layout, order }), [persist, layout]);

  const toggleHidden = useCallback(
    (key: string) => {
      const hidden = layout.hidden.includes(key)
        ? layout.hidden.filter((k) => k !== key)
        : [...layout.hidden, key];
      return persist({ ...layout, hidden });
    },
    [persist, layout]
  );

  const reset = useCallback(() => persist(sanitize(null)), [persist]);

  const visible = useMemo(
    () => layout.order.filter((k) => !layout.hidden.includes(k)),
    [layout]
  );

  return { visible, hidden: layout.hidden, reorder, toggleHidden, reset };
}

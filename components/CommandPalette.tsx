'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, CornerDownLeft } from 'lucide-react';
import { useSupabase } from '@/components/providers/SupabaseProvider';
import { NAV_ITEMS } from '@/components/layout/navItems';

interface Hit {
  label: string;
  sub: string;
  href: string;
}

// Cmd/Ctrl+K command palette. Loads the user's tasks, notes, journal and
// habits once on open, then fuzzy-filters everything (plus navigation) live.
export function CommandPalette() {
  const router = useRouter();
  const { supabase, user } = useSupabase();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const [data, setData] = useState<Hit[]>([]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === 'Escape') setOpen(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (!open || !user) return;
    setQuery('');
    setActive(0);
    (async () => {
      const [tasks, notes, journal, habits] = await Promise.all([
        supabase.from('tasks').select('*'),
        supabase.from('notes').select('*'),
        supabase.from('journal_entries').select('*'),
        supabase.from('habits').select('*'),
      ]);
      const hits: Hit[] = [];
      ((tasks.data ?? []) as { title: string }[]).forEach((t) => hits.push({ label: t.title, sub: 'Task', href: '/tasks' }));
      ((notes.data ?? []) as { content: string }[]).forEach((n) => hits.push({ label: n.content.slice(0, 60), sub: 'Note', href: '/notes' }));
      ((journal.data ?? []) as { content: unknown }[]).forEach((j) => {
        const c = j.content as { text?: string } | null;
        hits.push({ label: c?.text?.slice(0, 60) ?? 'Journal entry', sub: 'Journal', href: '/journal' });
      });
      ((habits.data ?? []) as { name: string }[]).forEach((h) => hits.push({ label: h.name, sub: 'Habit', href: '/habits' }));
      setData(hits);
    })();
  }, [open, user, supabase]);

  const results = useMemo(() => {
    const nav: Hit[] = [
      ...NAV_ITEMS.map((n) => ({ label: n.label, sub: 'Go to', href: n.href })),
    ];
    const all = [...nav, ...data];
    if (!query.trim()) return nav;
    const q = query.toLowerCase();
    return all.filter((h) => h.label.toLowerCase().includes(q) || h.sub.toLowerCase().includes(q)).slice(0, 8);
  }, [query, data]);

  function go(h: Hit) {
    setOpen(false);
    router.push(h.href);
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-start justify-center px-4 pt-[18vh]"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} aria-hidden />
          <motion.div
            initial={{ y: 16, opacity: 0, scale: 0.98 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 16, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            className="glass-card relative z-10 w-full max-w-lg overflow-hidden p-0"
            role="dialog" aria-modal="true" aria-label="Command palette"
          >
            <div className="flex items-center gap-3 border-b border-border px-4 py-3">
              <Search size={18} className="text-text-secondary" />
              <input
                autoFocus value={query}
                onChange={(e) => { setQuery(e.target.value); setActive(0); }}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, results.length - 1)); }
                  if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
                  if (e.key === 'Enter' && results[active]) go(results[active]);
                }}
                placeholder="Search tasks, notes, journal, or jump to a page…"
                className="flex-1 bg-transparent text-sm text-text-primary outline-none placeholder:text-text-secondary/60"
              />
              <kbd className="rounded-md border border-border px-1.5 py-0.5 text-[10px] text-text-secondary">esc</kbd>
            </div>
            <ul className="max-h-72 overflow-y-auto p-2">
              {results.length === 0 && <li className="px-3 py-6 text-center text-sm text-text-secondary">Nothing found.</li>}
              {results.map((h, i) => (
                <li key={`${h.href}-${i}`}>
                  <button
                    onMouseEnter={() => setActive(i)}
                    onClick={() => go(h)}
                    className="flex w-full items-center justify-between rounded-[var(--radius)] px-3 py-2.5 text-left text-sm transition-colors"
                    style={{ background: i === active ? 'var(--accent-light)' : 'transparent' }}
                  >
                    <span className="min-w-0">
                      <span className="truncate text-text-primary">{h.label}</span>
                    </span>
                    <span className="ml-3 flex shrink-0 items-center gap-2">
                      <span className="text-[11px] text-text-secondary">{h.sub}</span>
                      {i === active && <CornerDownLeft size={13} className="text-[var(--accent)]" />}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

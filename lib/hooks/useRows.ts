'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Database } from '@/lib/supabase/types';
import { useSupabase } from '@/components/providers/SupabaseProvider';

type Tables = Database['public']['Tables'];
type TableName = keyof Tables & string;
type Row<T extends TableName> = Tables[T]['Row'];
type Insert<T extends TableName> = Tables[T]['Insert'];
type Update<T extends TableName> = Tables[T]['Update'];

interface Options<T extends TableName> {
  orderBy?: keyof Row<T> & string;
  ascending?: boolean;
  realtime?: boolean;
}

/**
 * The data workhorse. Loads every row the current user owns from a table
 * (RLS guarantees that's only their rows), and exposes typed insert / update /
 * remove that keep local state in sync. Optionally live-updates via realtime.
 */
export function useRows<T extends TableName>(table: T, opts: Options<T> = {}) {
  const { supabase, user } = useSupabase();
  const [rows, setRows] = useState<Row<T>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const optsRef = useRef(opts);
  const channelIdRef = useRef(`${Date.now()}-${Math.round(Math.random() * 1_000_000)}`);
  optsRef.current = opts;

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    let query = supabase.from(table).select('*');
    const { orderBy, ascending } = optsRef.current;
    if (orderBy) query = query.order(orderBy, { ascending: ascending ?? true });
    const { data, error: err } = await query;
    if (err) setError(err.message);
    else setRows((data ?? []) as unknown as Row<T>[]);
    setLoading(false);
  }, [supabase, table, user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Live updates: any change to this user's rows triggers a refetch.
  useEffect(() => {
    if (!user || !optsRef.current.realtime) return;
    const channel = supabase
      .channel(`rt:${table}:${user.id}:${channelIdRef.current}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table, filter: `user_id=eq.${user.id}` },
        () => void refresh()
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [supabase, table, user, refresh]);

  // The Supabase client's mutation generics resolve poorly against a generic
  // table param, so we go through a deliberately narrow surface. Reads stay
  // fully typed above; only the write payloads are coerced here.
  type DbResult = { error: { message: string } | null };
  type Mutable = {
    insert: (v: unknown) => {
      select: () => { single: () => Promise<{ data: unknown } & DbResult> };
    };
    update: (v: unknown) => { eq: (col: string, val: string) => Promise<DbResult> };
    delete: () => { eq: (col: string, val: string) => Promise<DbResult> };
  };
  const mutable = useCallback(
    () => supabase.from(table) as unknown as Mutable,
    [supabase, table]
  );

  const insert = useCallback(
    async (values: Omit<Insert<T>, 'user_id'>) => {
      if (!user) return null;
      const payload = { ...values, user_id: user.id };
      const { data, error: err } = await mutable().insert(payload).select().single();
      if (err) {
        setError(err.message);
        return null;
      }
      const inserted = data as Row<T>;
      setRows((prev) => [...prev, inserted]);
      void refresh();
      return inserted;
    },
    [mutable, user, refresh]
  );

  const update = useCallback(
    async (id: string, values: Update<T>) => {
      const { error: err } = await mutable().update(values).eq('id', id);
      if (err) {
        setError(err.message);
        return;
      }
      setRows((prev) =>
        prev.map((r) => ((r as { id: string }).id === id ? { ...r, ...values } : r))
      );
    },
    [mutable]
  );

  const remove = useCallback(
    async (id: string) => {
      const { error: err } = await mutable().delete().eq('id', id);
      if (err) {
        setError(err.message);
        return;
      }
      setRows((prev) => prev.filter((r) => (r as { id: string }).id !== id));
    },
    [mutable]
  );

  return { rows, loading, error, refresh, insert, update, remove };
}

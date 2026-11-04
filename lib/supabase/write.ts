import type { Database } from '@/lib/supabase/types';

type DbResult = { error: { message: string } | null };

// A deliberately narrow write surface. This version of the Supabase client has
// fragile mutation generics over a large schema, so the handful of bespoke
// writes that don't go through useRows coerce to this minimal shape. Reads
// elsewhere cast their own results. Runtime behaviour is unaffected.
export interface Writer {
  insert: (values: Record<string, unknown>) => PromiseLike<DbResult>;
  update: (values: Record<string, unknown>) => {
    eq: (column: string, value: string) => PromiseLike<DbResult>;
  };
  delete: () => { eq: (column: string, value: string) => PromiseLike<DbResult> };
}

// Accept anything with a `from` method so we don't couple to the client's
// version-specific generic parameters.
type HasFrom = { from: (table: string) => unknown };

export function writer(
  supabase: HasFrom,
  table: keyof Database['public']['Tables'] & string
): Writer {
  return supabase.from(table) as unknown as Writer;
}

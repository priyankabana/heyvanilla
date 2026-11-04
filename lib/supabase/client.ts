import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/lib/supabase/types';

// Browser-side client. Uses ONLY the public anon key — never the service role.
// Row Level Security is what keeps each user locked to their own rows.
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

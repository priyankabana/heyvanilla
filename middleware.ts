import type { NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

// Runs on every request. Refreshes the Supabase session, protects every
// route except /login, and stamps security headers on the response.
export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // Match everything except Next internals and static assets.
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|icons|.*\\.(?:svg|png|jpg|jpeg|gif|webp|json)$).*)',
  ],
};

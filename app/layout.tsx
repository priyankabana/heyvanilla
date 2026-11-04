import type { Metadata, Viewport } from 'next';
import { Fraunces, Quicksand, Inter } from 'next/font/google';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { SupabaseProvider } from '@/components/providers/SupabaseProvider';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import '@/styles/globals.css';

// Display face is now Fraunces (soft modern serif). It keeps the existing
// `--font-playfair` CSS variable name so every `var(--font-playfair)` usage
// across the app picks it up with no churn.
const playfair = Fraunces({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-playfair',
  display: 'swap',
});

const quicksand = Quicksand({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-quicksand',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'HeyVanilla',
  description: "don't melt, Vanilla. you got this.",
  manifest: '/manifest.json',
  appleWebApp: { capable: true, title: 'HeyVanilla', statusBarStyle: 'default' },
};

export const viewport: Viewport = {
  themeColor: '#BC335F',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

const VALID_AESTHETICS = new Set([
  'princess-barbie',
  'strawberry-kiss',
  'matcha-strawberry',
  'purple-life',
  'moon',
  'apple-cider',
  'lana-del-ray',
  'midnight-rain',
  'midnight-plum',
]);

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Theme is stored in a cookie too, so the server can put the right
  // theme-* class on <html> during SSR — no flash, no inline script.
  const jar = cookies();
  const cookieAesthetic = jar.get('heyvanilla_aesthetic')?.value;
  const aesthetic =
    cookieAesthetic && VALID_AESTHETICS.has(cookieAesthetic)
      ? cookieAesthetic
      : 'moon';

  // Resolve light/dark from the cookie too. 'auto' can't be known server-side
  // (it depends on the OS), so it falls back to light here and the client
  // corrects it on mount.
  const mode = jar.get('heyvanilla_mode')?.value;
  const darkClass = mode === 'dark' ? ' mode-dark' : '';

  // Resolve the user once on the server so first render already knows.
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <html
      lang="en"
      className={`theme-${aesthetic}${darkClass} ${playfair.variable} ${quicksand.variable} ${inter.variable}`}
      suppressHydrationWarning
    >
      <body>
        <SupabaseProvider initialUser={user}>
          <ThemeProvider>{children}</ThemeProvider>
        </SupabaseProvider>
      </body>
    </html>
  );
}

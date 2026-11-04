'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import type { Aesthetic, UsersProfile } from '@/lib/supabase/types';
import { useSupabase } from './SupabaseProvider';
import { writer } from '@/lib/supabase/write';

export const AESTHETICS: { key: Aesthetic; label: string }[] = [
  { key: 'princess-barbie', label: 'Princess Barbie' },
  { key: 'strawberry-kiss', label: 'Strawberry Kiss' },
  { key: 'matcha-strawberry', label: 'Matcha Strawberry' },
  { key: 'purple-life', label: 'Purple Life' },
  { key: 'moon', label: 'Moon' },
  { key: 'apple-cider', label: 'Apple Cider' },
  { key: 'lana-del-ray', label: 'Lana Del Ray' },
  { key: 'midnight-rain', label: 'Midnight Rain' },
  { key: 'midnight-plum', label: 'Midnight Plum' },
];

const STORAGE_KEY = 'heyvanilla_aesthetic';
const MODE_KEY = 'heyvanilla_mode';
const DEFAULT: Aesthetic = 'moon';

export type Mode = 'light' | 'dark' | 'auto';

type ThemeContextValue = {
  aesthetic: Aesthetic;
  setAesthetic: (next: Aesthetic) => void;
  surpriseMe: () => void;
  mode: Mode;
  setMode: (next: Mode) => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function applyToDom(aesthetic: Aesthetic) {
  const html = document.documentElement;
  // Drop any previous theme-* class, then add the new one.
  html.classList.forEach((c) => {
    if (c.startsWith('theme-')) html.classList.remove(c);
  });
  html.classList.add(`theme-${aesthetic}`);
}

function prefersDark(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

// Resolve light/dark/auto into the concrete .mode-dark class.
function applyMode(mode: Mode) {
  const dark = mode === 'dark' || (mode === 'auto' && prefersDark());
  document.documentElement.classList.toggle('mode-dark', dark);
}

// Mirror the choice into a cookie so the server can SSR the correct theme
// class on the next load (this is what prevents the flash).
function persist(aesthetic: Aesthetic) {
  window.localStorage.setItem(STORAGE_KEY, aesthetic);
  document.cookie = `heyvanilla_aesthetic=${aesthetic}; path=/; max-age=31536000; samesite=lax`;
}

function persistMode(mode: Mode) {
  window.localStorage.setItem(MODE_KEY, mode);
  document.cookie = `heyvanilla_mode=${mode}; path=/; max-age=31536000; samesite=lax`;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { supabase, user } = useSupabase();
  const [aesthetic, setAestheticState] = useState<Aesthetic>(DEFAULT);
  const [mode, setModeState] = useState<Mode>('light');

  // 1) On mount: read localStorage immediately so there's no flash of the
  //    wrong theme. The blocking script in <head> already set the class;
  //    this just keeps React state in agreement.
  useEffect(() => {
    // One-time migration: make Moon the default. Bumping THEME_VERSION resets
    // everyone to Moon once; after that their own picks persist normally.
    const THEME_VERSION = '2';
    if (window.localStorage.getItem('heyvanilla_theme_v') !== THEME_VERSION) {
      window.localStorage.setItem('heyvanilla_theme_v', THEME_VERSION);
      setAestheticState(DEFAULT);
      applyToDom(DEFAULT);
      persist(DEFAULT);
    } else {
      const stored = window.localStorage.getItem(STORAGE_KEY) as Aesthetic | null;
      if (stored) {
        setAestheticState(stored);
        applyToDom(stored);
      }
    }
    const storedMode = window.localStorage.getItem(MODE_KEY) as Mode | null;
    if (storedMode) {
      setModeState(storedMode);
      applyMode(storedMode);
    }
  }, []);

  // Keep auto mode honest: follow the OS if it flips while the app is open.
  useEffect(() => {
    if (mode !== 'auto') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => applyMode('auto');
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [mode]);

  // 2) Once logged in: the Supabase profile is the source of truth. Pull it
  //    and reconcile (handles "I switched themes on my laptop" cross-device).
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('users_profile')
        .select('*')
        .eq('id', user.id)
        .single();
      const profile = data as UsersProfile | null;
      // Only let the profile set the theme when THIS device has no local choice
      // yet (i.e. a fresh device / first login). Otherwise the device's saved
      // pick always wins — so a reload never snaps back to a default.
      const hasLocalAesthetic = !!window.localStorage.getItem(STORAGE_KEY);
      const hasLocalMode = !!window.localStorage.getItem(MODE_KEY);
      if (!cancelled && profile?.aesthetic && !hasLocalAesthetic) {
        setAestheticState(profile.aesthetic);
        applyToDom(profile.aesthetic);
        persist(profile.aesthetic);
      }
      if (!cancelled && profile?.theme && !hasLocalMode) {
        setModeState(profile.theme);
        applyMode(profile.theme);
        persistMode(profile.theme);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, supabase]);

  const setAesthetic = useCallback(
    (next: Aesthetic) => {
      setAestheticState(next);
      applyToDom(next);
      persist(next);
      // Persist to the profile so it follows the user to every device.
      if (user) {
        void writer(supabase, 'users_profile')
          .update({ aesthetic: next })
          .eq('id', user.id);
      }
    },
    [user, supabase]
  );

  const surpriseMe = useCallback(() => {
    const pool = AESTHETICS.filter((a) => a.key !== aesthetic);
    const pick = pool[Math.floor(Math.random() * pool.length)]!;
    setAesthetic(pick.key);
  }, [aesthetic, setAesthetic]);

  const setMode = useCallback(
    (next: Mode) => {
      setModeState(next);
      applyMode(next);
      persistMode(next);
      if (user) {
        void writer(supabase, 'users_profile').update({ theme: next }).eq('id', user.id);
      }
    },
    [user, supabase]
  );

  return (
    <ThemeContext.Provider value={{ aesthetic, setAesthetic, surpriseMe, mode, setMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
  return ctx;
}

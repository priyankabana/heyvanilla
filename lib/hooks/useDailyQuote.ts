'use client';

import { useEffect, useState } from 'react';

export interface Quote {
  id: number;
  quote: string;
  author: string;
}

const FALLBACK: Quote = {
  id: 1,
  quote: "don't melt, Vanilla. you got this.",
  author: 'personal',
};
const STORE_KEY = 'heyvanilla_quote';

/** Returns one affirmation pinned for the day. Cached in localStorage with the
 *  date so it only rotates every 24h. Shared by the welcome hero + QuoteWidget. */
export function useDailyQuote(): Quote {
  const [quote, setQuote] = useState<Quote>(FALLBACK);

  useEffect(() => {
    const todayKey = new Date().toISOString().slice(0, 10);
    try {
      const cached = JSON.parse(localStorage.getItem(STORE_KEY) ?? 'null') as
        | { date: string; quote: Quote }
        | null;
      if (cached?.date === todayKey) {
        setQuote(cached.quote);
        return;
      }
    } catch {
      /* ignore malformed cache */
    }

    fetch('/quotes.json')
      .then((r) => r.json())
      .then((all: Quote[]) => {
        const dayIndex = Math.floor(Date.now() / 86400000) % all.length;
        const picked = all[dayIndex] ?? all[0] ?? FALLBACK;
        setQuote(picked);
        localStorage.setItem(STORE_KEY, JSON.stringify({ date: todayKey, quote: picked }));
      })
      .catch(() => setQuote(FALLBACK));
  }, []);

  return quote;
}

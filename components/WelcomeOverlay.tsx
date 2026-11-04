'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSupabase } from '@/components/providers/SupabaseProvider';
import { greeting } from '@/lib/utils/date';
import { useDailyQuote } from '@/lib/hooks/useDailyQuote';

const KEY = 'heyvanilla_welcomed';

/** A gentle post-login moment: the greeting types in word-by-word, the
 *  affirmation follows, then the whole thing fades away (~4s total). Plays
 *  once per session, separate from the pre-login splash. Tap to skip.
 *
 *  The pre-paint script in the dashboard layout sets
 *  <html data-welcoming="1"> before the page paints, and CSS hides the
 *  dashboard underneath — so there's no flash of the dashboard before the
 *  greeting. We clear that attribute when the greeting finishes. */
export function WelcomeOverlay() {
  const { user } = useSupabase();
  const { text, emoji } = greeting();
  const quote = useDailyQuote();

  // Decide on the very first client render. The layout script already set
  // data-welcoming, so reading it here keeps React in agreement without a flash.
  const [show, setShow] = useState(
    () =>
      typeof document !== 'undefined' &&
      document.documentElement.getAttribute('data-welcoming') === '1'
  );

  const reveal = useCallback(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.removeAttribute('data-welcoming');
    }
  }, []);

  const dismiss = useCallback(() => {
    setShow(false);
    reveal();
  }, [reveal]);

  const name =
    (user?.user_metadata?.name as string | undefined) ??
    user?.email?.split('@')[0] ??
    'Vanilla';

  // Mark the session and schedule the fade-out once shown.
  useEffect(() => {
    if (!show) {
      reveal();
      return;
    }
    try {
      sessionStorage.setItem(KEY, '1');
    } catch {
      /* ignore */
    }
    const t = setTimeout(dismiss, 4000);
    return () => clearTimeout(t);
  }, [show, dismiss, reveal]);

  const greetWords = useMemo(() => `${text}, ${name} ${emoji}`.split(' '), [text, name, emoji]);
  const quoteWords = useMemo(() => `\u201c${quote.quote}\u201d`.split(' '), [quote]);

  // The affirmation starts once the greeting has finished landing.
  const quoteDelay = 0.2 + greetWords.length * 0.16 + 0.25;

  return (
    <AnimatePresence onExitComplete={reveal}>
      {show && (
        <motion.div
          key="welcome"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.6, ease: 'easeInOut' } }}
          onClick={dismiss}
          className="fixed inset-0 z-[150] flex flex-col items-center justify-center overflow-hidden px-6 text-center"
          style={{ background: 'var(--bg-primary)' }}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'radial-gradient(60% 50% at 50% 38%, var(--accent-light), transparent 70%)',
              opacity: 0.55,
            }}
          />

          {/* greeting — word by word */}
          <motion.h1
            className="relative flex flex-wrap justify-center gap-x-3 text-4xl sm:text-5xl"
            style={{ fontFamily: 'var(--font-playfair), serif', fontWeight: 600 }}
            initial="hidden"
            animate="show"
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.16, delayChildren: 0.2 } } }}
          >
            {greetWords.map((w, i) => (
              <motion.span
                key={i}
                variants={{
                  hidden: { opacity: 0, y: 20, filter: 'blur(8px)' },
                  show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.5, ease: 'easeOut' } },
                }}
              >
                {w}
              </motion.span>
            ))}
          </motion.h1>

          {/* affirmation — word by word, after the greeting */}
          <motion.p
            className="relative mt-5 flex max-w-xl flex-wrap justify-center gap-x-2 text-lg italic leading-relaxed text-text-secondary sm:text-xl"
            style={{ fontFamily: 'var(--font-playfair), serif' }}
            initial="hidden"
            animate="show"
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07, delayChildren: quoteDelay } } }}
          >
            {quoteWords.map((w, i) => (
              <motion.span
                key={i}
                variants={{
                  hidden: { opacity: 0, y: 10 },
                  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
                }}
              >
                {w}
              </motion.span>
            ))}
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

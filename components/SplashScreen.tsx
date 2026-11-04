'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

const SESSION_KEY = 'heyvanilla_splashed';
const QUOTE = "don't melt, Vanilla. you got this.";

// Returns true once the splash has already played this browser session.
export function hasSplashed(): boolean {
  if (typeof window === 'undefined') return true;
  return window.sessionStorage.getItem(SESSION_KEY) === '1';
}

const WORDS = [
  { text: 'Hey', accent: false },
  { text: 'Vanilla', accent: true },
];

/**
 * The very first thing a user sees. Plays once per session, then unmounts.
 *
 * Timeline (~4.3s):
 *   0.0-1.6s  big "Hey Vanilla" springs up word-by-word with a soft glow
 *   1.6-2.4s  accent rule draws, the quote fades up beneath it
 *   2.4-3.8s  hold
 *   3.8-4.3s  fade to the app background, then hand off to the page
 */
export default function SplashScreen({ onFinish }: { onFinish: () => void }) {
  const [showQuote, setShowQuote] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const finished = useRef(false);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    timers.push(setTimeout(() => setShowQuote(true), 1600));
    timers.push(setTimeout(() => setLeaving(true), 3800));

    timers.push(
      setTimeout(() => {
        if (finished.current) return;
        finished.current = true;
        window.sessionStorage.setItem(SESSION_KEY, '1');
        onFinish();
      }, 4300)
    );

    return () => timers.forEach(clearTimeout);
  }, [onFinish]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{
        opacity: leaving ? 0 : 1,
        backgroundColor: leaving ? 'var(--bg-primary)' : '#0a0a0a',
      }}
      transition={{ duration: 0.5, ease: 'easeInOut' }}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden"
      style={{ backgroundColor: '#0a0a0a' }}
    >
      {/* A soft pool of theme colour breathes behind the wordmark */}
      <motion.div
        aria-hidden
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: leaving ? 0 : 0.35, scale: 1 }}
        transition={{ duration: 1.8, ease: 'easeOut' }}
        className="pointer-events-none absolute"
        style={{
          width: '75vmax',
          height: '75vmax',
          background:
            'radial-gradient(circle, var(--accent) 0%, transparent 60%)',
          filter: 'blur(60px)',
        }}
      />

      <motion.h1
        initial="hidden"
        animate="show"
        variants={{
          hidden: {},
          show: { transition: { staggerChildren: 0.22, delayChildren: 0.3 } },
        }}
        className="relative flex flex-wrap items-baseline justify-center gap-x-4"
        style={{
          margin: 0,
          fontFamily: 'var(--font-playfair), serif',
          fontWeight: 600,
          fontSize: 'clamp(3rem, 15vw, 7rem)',
          lineHeight: 1,
        }}
      >
        {WORDS.map((w) => (
          <motion.span
            key={w.text}
            variants={{
              hidden: { opacity: 0, y: 64, scale: 0.7, filter: 'blur(10px)' },
              show: {
                opacity: 1,
                y: 0,
                scale: 1,
                filter: 'blur(0px)',
                transition: { type: 'spring', stiffness: 170, damping: 15 },
              },
            }}
            style={
              w.accent
                ? {
                    color: 'var(--accent)',
                    textShadow:
                      '0 0 36px color-mix(in srgb, var(--accent) 65%, transparent)',
                  }
                : { color: '#FFF8F0' }
            }
          >
            {w.text}
          </motion.span>
        ))}
      </motion.h1>

      <motion.div
        initial={{ width: 0, opacity: 0 }}
        animate={{ width: showQuote ? 150 : 0, opacity: showQuote ? 1 : 0 }}
        transition={{ duration: 0.6, ease: 'easeInOut' }}
        style={{ height: 2, marginTop: 30, borderRadius: 2, background: 'var(--accent)' }}
      />

      <motion.p
        aria-label={QUOTE}
        initial={{ opacity: 0, y: 18 }}
        animate={showQuote ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 }}
        transition={{ duration: 0.75, ease: 'easeOut', delay: 0.15 }}
        style={{
          marginTop: 22,
          padding: '0 1.25rem',
          textAlign: 'center',
          fontFamily: 'var(--font-quicksand), sans-serif',
          fontWeight: 500,
          fontSize: 'clamp(1rem, 4.5vw, 1.35rem)',
          letterSpacing: '0.02em',
          color: 'rgba(255, 248, 240, 0.78)',
        }}
      >
        {QUOTE}
      </motion.p>
    </motion.div>
  );
}

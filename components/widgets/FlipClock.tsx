'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

// A split-flap tile that "flips" (rotateX) whenever its value changes.
function FlipTile({ value, sublabel }: { value: string; sublabel: string }) {
  return (
    <div
      className="relative flex flex-col items-center justify-center overflow-hidden rounded-2xl"
      style={{
        width: 132,
        height: 148,
        background: 'linear-gradient(180deg, #2a2030, #18121d)',
        boxShadow:
          '0 14px 30px -16px rgba(0,0,0,0.6), 0 1px 0 0 rgba(255,255,255,0.08) inset',
      }}
    >
      <div className="pointer-events-none absolute inset-x-0 top-1/2 z-10 h-px -translate-y-px bg-black/40" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-white/[0.04]" />

      <AnimatePresence mode="popLayout">
        <motion.span
          key={value}
          initial={{ rotateX: -85, opacity: 0, y: -6 }}
          animate={{ rotateX: 0, opacity: 1, y: 0 }}
          exit={{ rotateX: 80, opacity: 0, y: 6 }}
          transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
          className="tabular-nums leading-none"
          style={{
            fontFamily: 'var(--font-playfair), serif',
            fontWeight: 600,
            fontSize: '4.6rem',
            color: '#FFF8F0',
            textShadow: '0 2px 10px rgba(0,0,0,0.4)',
          }}
        >
          {value}
        </motion.span>
      </AnimatePresence>

      <span
        className="absolute bottom-2.5 text-[10px] font-semibold uppercase tracking-[0.22em]"
        style={{ color: 'var(--accent-light)' }}
      >
        {sublabel}
      </span>
    </div>
  );
}

export function FlipClock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!now) {
    return <div className="skeleton h-[148px] w-[300px]" />;
  }

  let h = now.getHours();
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  const hh = `${h}`.padStart(2, '0');
  const mm = `${now.getMinutes()}`.padStart(2, '0');
  const weekday = now.toLocaleDateString(undefined, { weekday: 'long' });
  const dateStr = now.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'long',
  });

  return (
    <div className="flex flex-col items-center gap-2.5">
      {/* HH : MM — two clean tiles, like the reference clocks */}
      <div className="flex items-center gap-2.5" style={{ perspective: 600 }}>
        <FlipTile value={hh} sublabel={ampm} />
        <span className="pb-6 text-5xl font-light" style={{ color: 'var(--accent)' }}>
          :
        </span>
        <FlipTile value={mm} sublabel="min" />
      </div>
      {/* tidy date line underneath instead of a messy third tile */}
      <p className="text-sm text-text-secondary">
        <span className="text-text-primary">{weekday}</span> · {dateStr}
      </p>
    </div>
  );
}

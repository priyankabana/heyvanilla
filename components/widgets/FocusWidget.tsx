'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Timer, Play, Pause, RotateCcw, Maximize2, X } from 'lucide-react';
import { WidgetShell } from './WidgetShell';

type Phase = 'focus' | 'short' | 'long';
const MINUTES: Record<Phase, number> = { focus: 25, short: 5, long: 15 };
const LABEL: Record<Phase, string> = { focus: 'Focus', short: 'Short break', long: 'Long break' };

// A short, soft two-note chime via the Web Audio API — no audio files needed.
function chime() {
  try {
    const Ctx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    [880, 1320].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = freq;
      osc.type = 'sine';
      const t = ctx.currentTime + i * 0.18;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.25, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.45);
    });
    setTimeout(() => void ctx.close(), 1200);
  } catch {
    /* audio not available — silently skip */
  }
}

export function FocusWidget() {
  const [phase, setPhase] = useState<Phase>('focus');
  const [secondsLeft, setSecondsLeft] = useState(MINUTES.focus * 60);
  const [running, setRunning] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const tick = useRef<ReturnType<typeof setInterval> | null>(null);

  const stop = useCallback(() => {
    if (tick.current) clearInterval(tick.current);
    tick.current = null;
  }, []);

  useEffect(() => stop, [stop]);

  // Esc leaves the full-screen focus view.
  useEffect(() => {
    if (!fullscreen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setFullscreen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [fullscreen]);

  const start = useCallback(() => {
    if (tick.current) return;
    setRunning(true);
    tick.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          stop();
          setRunning(false);
          chime();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  }, [stop]);

  function setTo(next: Phase) {
    stop();
    setRunning(false);
    setPhase(next);
    setSecondsLeft(MINUTES[next] * 60);
  }

  // Turning on focus drops you into the full-screen, timer-only view.
  function startFocus() {
    start();
    setFullscreen(true);
  }

  function pause() {
    stop();
    setRunning(false);
  }

  function reset() {
    stop();
    setRunning(false);
    setSecondsLeft(MINUTES[phase] * 60);
  }

  const mm = `${Math.floor(secondsLeft / 60)}`.padStart(2, '0');
  const ss = `${secondsLeft % 60}`.padStart(2, '0');

  const phaseTabs = (
    <div className="flex gap-1.5">
      {(['focus', 'short', 'long'] as Phase[]).map((p) => (
        <button
          key={p}
          onClick={() => setTo(p)}
          className="rounded-full px-2.5 py-1 text-[11px] transition-all"
          style={{
            backgroundColor: phase === p ? 'var(--accent)' : 'transparent',
            color: phase === p ? '#fff' : 'var(--text-secondary)',
            border: phase === p ? 'none' : '1px solid var(--border)',
          }}
        >
          {LABEL[p]}
        </button>
      ))}
    </div>
  );

  return (
    <>
      <WidgetShell icon={<Timer size={16} />} title="Focus" href="/study">
        <div className="flex h-full flex-col items-center justify-center gap-3">
          <div className="flex items-center gap-2">
            {phaseTabs}
            <button
              onClick={() => setFullscreen(true)}
              aria-label="Full-screen focus"
              className="rounded-full border border-border p-1.5 text-text-secondary transition-colors hover:text-[var(--accent)]"
            >
              <Maximize2 size={12} />
            </button>
          </div>

          <p
            className="tabular-nums text-4xl font-semibold text-text-primary"
            style={{ fontFamily: 'var(--font-playfair), serif' }}
          >
            {mm}:{ss}
          </p>

          <div className="flex gap-2">
            <button
              onClick={running ? pause : startFocus}
              className="flex items-center gap-1.5 rounded-full bg-[var(--accent)] px-4 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[var(--accent-dark)]"
            >
              {running ? <Pause size={13} /> : <Play size={13} />}
              {running ? 'Pause' : 'Start'}
            </button>
            <button
              onClick={reset}
              aria-label="Reset timer"
              className="rounded-full border border-border p-2 text-text-secondary transition-colors hover:text-[var(--accent)]"
            >
              <RotateCcw size={13} />
            </button>
          </div>
        </div>
      </WidgetShell>

      {/* FULL-SCREEN FOCUS — timer only, nothing else */}
      <AnimatePresence>
        {fullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="fixed inset-0 z-[160] flex flex-col items-center justify-center overflow-hidden"
            style={{ background: 'var(--bg-primary)' }}
          >
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  'radial-gradient(55% 50% at 50% 45%, var(--accent-light), transparent 72%)',
                opacity: 0.45,
              }}
            />

            <button
              onClick={() => setFullscreen(false)}
              aria-label="Exit focus"
              className="absolute right-5 top-5 z-10 rounded-full border border-border bg-white/20 p-2 text-text-secondary backdrop-blur transition-colors hover:text-[var(--accent)]"
            >
              <X size={18} />
            </button>

            <p className="relative mb-4 text-sm uppercase tracking-[0.3em] text-text-secondary">
              {LABEL[phase]}
            </p>

            <motion.p
              key={phase}
              className="relative tabular-nums leading-none text-text-primary"
              style={{
                fontFamily: 'var(--font-playfair), serif',
                fontWeight: 600,
                fontSize: 'clamp(5rem, 26vw, 18rem)',
                textShadow: '0 8px 40px color-mix(in srgb, var(--accent) 35%, transparent)',
              }}
            >
              {mm}:{ss}
            </motion.p>

            <div className="relative mt-10 flex items-center gap-3">
              <button
                onClick={running ? pause : start}
                className="flex items-center gap-2 rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[var(--accent-dark)]"
              >
                {running ? <Pause size={16} /> : <Play size={16} />}
                {running ? 'Pause' : 'Resume'}
              </button>
              <button
                onClick={reset}
                aria-label="Reset timer"
                className="rounded-full border border-border p-3 text-text-secondary transition-colors hover:text-[var(--accent)]"
              >
                <RotateCcw size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

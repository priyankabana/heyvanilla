'use client';

import { useState } from 'react';
import { Palette, Shuffle, Check } from 'lucide-react';
import { useTheme, AESTHETICS } from '@/components/providers/ThemeProvider';
import { Modal } from '@/components/ui/Modal';
import { cn } from '@/lib/utils/cn';

// A little swatch per theme so the picker actually previews the vibe.
const SWATCH: Record<string, string> = {
  'princess-barbie': '#bc335f',
  'strawberry-kiss': '#e8537e',
  'matcha-strawberry': '#7fa96b',
  'purple-life': '#8b5cf6',
  moon: '#6b7280',
  'apple-cider': '#c2703d',
  'lana-del-ray': '#9b6a6c',
  'midnight-rain': '#5b8fb9',
  'midnight-plum': '#8e6a9e',
};

export function ThemeSwitcher() {
  const { aesthetic, setAesthetic, surpriseMe } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-3 rounded-[var(--radius)] px-3 py-2.5 text-sm text-text-secondary transition-colors hover:bg-white/30 hover:text-text-primary"
      >
        <Palette size={18} />
        Theme
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Pick your vibe">
        <div className="grid grid-cols-1 gap-2">
          {AESTHETICS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setAesthetic(key)}
              className={cn(
                'flex items-center gap-3 rounded-[var(--radius)] border px-3 py-2.5 text-left text-sm transition-all',
                aesthetic === key
                  ? 'border-[var(--accent)] bg-white/40'
                  : 'border-border hover:bg-white/30'
              )}
            >
              <span
                className="h-5 w-5 rounded-full ring-1 ring-black/10"
                style={{ backgroundColor: SWATCH[key] }}
                aria-hidden
              />
              <span className="flex-1 text-text-primary">{label}</span>
              {aesthetic === key && <Check size={16} className="text-[var(--accent)]" />}
            </button>
          ))}
        </div>

        <button
          onClick={() => {
            surpriseMe();
          }}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-[var(--radius)] bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--accent-dark)]"
        >
          <Shuffle size={16} />
          Surprise me
        </button>
      </Modal>
    </>
  );
}

'use client';

import { MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import { FlipClock } from '@/components/widgets/FlipClock';
import { useWeather } from '@/lib/hooks/useWeather';

function BareWeather() {
  const { weather, status } = useWeather();

  if (status === 'loading') {
    return (
      <div className="flex items-center gap-3">
        <div className="skeleton h-12 w-12 rounded-2xl" />
        <div className="space-y-1.5">
          <div className="skeleton h-6 w-16 rounded-md" />
          <div className="skeleton h-3 w-24 rounded-md" />
        </div>
      </div>
    );
  }

  if (status === 'error' || !weather) {
    // Stay quiet rather than show a broken/empty box.
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="flex items-center gap-3"
    >
      <span
        className="text-5xl leading-none"
        style={{ filter: 'drop-shadow(0 4px 12px color-mix(in srgb, var(--accent) 30%, transparent))' }}
        aria-hidden
      >
        {weather.emoji}
      </span>
      <div className="text-left">
        <p className="text-3xl font-semibold leading-none text-text-primary">{weather.temp}°</p>
        <p className="mt-1 text-sm capitalize text-text-secondary">{weather.description}</p>
        {weather.city && (
          <p className="flex items-center gap-1 text-sm text-text-secondary">
            <MapPin size={13} /> {weather.city}
          </p>
        )}
      </div>
    </motion.div>
  );
}

/** The time + weather block, pinned to the top-right of the dashboard. */
export function DashboardTopline() {
  return (
    <div className="flex flex-wrap items-center justify-end gap-x-10 gap-y-3">
      <BareWeather />
      <FlipClock />
    </div>
  );
}

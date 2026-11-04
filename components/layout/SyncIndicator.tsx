'use client';

import { useEffect, useRef, useState } from 'react';

type Status = 'synced' | 'syncing' | 'offline';

const MAP: Record<Status, { color: string; label: string }> = {
  synced: { color: 'var(--success)', label: 'synced' },
  syncing: { color: 'var(--warning)', label: 'syncing…' },
  offline: { color: 'var(--danger)', label: 'offline' },
};

/** Live connectivity dot for the TopBar: green when synced, amber for the brief
 *  reconnect window, red when the device is offline. */
export function SyncIndicator({ showLabel = true }: { showLabel?: boolean }) {
  const [status, setStatus] = useState<Status>('synced');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!navigator.onLine) setStatus('offline');

    function goOnline() {
      setStatus('syncing');
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setStatus('synced'), 1200);
    }
    function goOffline() {
      if (timer.current) clearTimeout(timer.current);
      setStatus('offline');
    }

    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const s = MAP[status];
  return (
    <span
      className="flex items-center gap-1.5 text-xs text-text-secondary"
      title={`Status: ${s.label}`}
      role="status"
      aria-label={`Status: ${s.label}`}
    >
      <span className="relative inline-flex h-2 w-2">
        {status !== 'offline' && (
          <span
            className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60"
            style={{ backgroundColor: s.color }}
          />
        )}
        <span
          className="relative inline-flex h-2 w-2 rounded-full"
          style={{ backgroundColor: s.color }}
        />
      </span>
      {showLabel && <span className="hidden sm:inline">{s.label}</span>}
    </span>
  );
}

'use client';

import { useCallback, useEffect, useState } from 'react';
import { Music, LogOut } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import {
  spotifyConfigured,
  spotifyConnected,
  beginSpotifyAuth,
  getNowPlaying,
  disconnectSpotify,
  type NowPlaying,
} from '@/lib/spotify';

export function SpotifyWidget() {
  const [configured] = useState(spotifyConfigured());
  const [connected, setConnected] = useState(false);
  const [track, setTrack] = useState<NowPlaying | null>(null);

  const poll = useCallback(async () => {
    if (!spotifyConnected()) return;
    const np = await getNowPlaying();
    setTrack(np);
  }, []);

  useEffect(() => {
    setConnected(spotifyConnected());
    void poll();
    const id = setInterval(poll, 20000); // refresh every 20s
    return () => clearInterval(id);
  }, [poll]);

  return (
    <Card>
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-sm font-medium text-text-primary">
          <span className="text-[var(--accent)]"><Music size={16} /></span>
          Now playing
        </span>
        {connected && (
          <button
            onClick={() => {
              disconnectSpotify();
              setConnected(false);
              setTrack(null);
            }}
            aria-label="Disconnect Spotify"
            className="text-text-secondary transition-colors hover:text-[var(--danger)]"
          >
            <LogOut size={14} />
          </button>
        )}
      </div>

      {!configured && (
        <p className="mt-3 text-sm text-text-secondary">
          Add <code className="text-xs">NEXT_PUBLIC_SPOTIFY_CLIENT_ID</code> to connect Spotify.
        </p>
      )}

      {configured && !connected && (
        <button
          onClick={() => void beginSpotifyAuth()}
          className="mt-3 rounded-full bg-[var(--accent)] px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-[var(--accent-dark)]"
        >
          Connect Spotify
        </button>
      )}

      {configured && connected && !track && (
        <p className="mt-3 text-sm text-text-secondary">Nothing playing right now.</p>
      )}

      {configured && connected && track && (
        <a
          href={track.url ?? '#'}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 flex items-center gap-3"
        >
          {track.albumImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={track.albumImage} alt={track.title} width={48} height={48} className="rounded-md" />
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-text-primary">{track.title}</p>
            <p className="truncate text-xs text-text-secondary">{track.artist}</p>
          </div>
        </a>
      )}
    </Card>
  );
}

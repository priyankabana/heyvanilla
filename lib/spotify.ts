// Spotify "now playing" via the Authorization Code + PKCE flow. This runs
// entirely client-side: it needs only a public client id (no secret, no server
// route). Tokens live in localStorage on the device that connected.
//
// Set NEXT_PUBLIC_SPOTIFY_CLIENT_ID and register your redirect URI in the
// Spotify dashboard (the app's origin, e.g. http://localhost:3000/).

const CLIENT_ID = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
const SCOPE = 'user-read-currently-playing user-read-playback-state';

const K = {
  verifier: 'hv_sp_verifier',
  refresh: 'hv_sp_refresh',
  access: 'hv_sp_access',
  expires: 'hv_sp_expires',
};

export interface NowPlaying {
  isPlaying: boolean;
  title: string;
  artist: string;
  albumImage: string | null;
  url: string | null;
}

export function spotifyConfigured(): boolean {
  return !!CLIENT_ID;
}

export function spotifyConnected(): boolean {
  if (typeof window === 'undefined') return false;
  return !!window.localStorage.getItem(K.refresh);
}

function redirectUri(): string {
  return process.env.NEXT_PUBLIC_SPOTIFY_REDIRECT_URI || `${window.location.origin}/`;
}

function randomString(len: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  const values = crypto.getRandomValues(new Uint8Array(len));
  return Array.from(values, (v) => chars[v % chars.length]).join('');
}

function base64url(bytes: ArrayBuffer): string {
  const str = String.fromCharCode(...new Uint8Array(bytes));
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function challenge(verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  return base64url(digest);
}

export async function beginSpotifyAuth(): Promise<void> {
  if (!CLIENT_ID) return;
  const verifier = randomString(64);
  window.localStorage.setItem(K.verifier, verifier);
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: CLIENT_ID,
    scope: SCOPE,
    redirect_uri: redirectUri(),
    code_challenge_method: 'S256',
    code_challenge: await challenge(verifier),
  });
  window.location.href = `https://accounts.spotify.com/authorize?${params.toString()}`;
}

// Called on redirect back with ?code=. Returns true if tokens were stored.
export async function completeSpotifyAuth(code: string): Promise<boolean> {
  if (!CLIENT_ID) return false;
  const verifier = window.localStorage.getItem(K.verifier);
  if (!verifier) return false;
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri(),
    client_id: CLIENT_ID,
    code_verifier: verifier,
  });
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!res.ok) return false;
  const data = await res.json();
  storeTokens(data);
  window.localStorage.removeItem(K.verifier);
  return true;
}

function storeTokens(data: { access_token: string; expires_in: number; refresh_token?: string }) {
  window.localStorage.setItem(K.access, data.access_token);
  window.localStorage.setItem(K.expires, String(Date.now() + data.expires_in * 1000));
  if (data.refresh_token) window.localStorage.setItem(K.refresh, data.refresh_token);
}

async function accessToken(): Promise<string | null> {
  if (!CLIENT_ID) return null;
  const current = window.localStorage.getItem(K.access);
  const expires = Number(window.localStorage.getItem(K.expires) ?? 0);
  if (current && Date.now() < expires - 30000) return current;

  const refresh = window.localStorage.getItem(K.refresh);
  if (!refresh) return null;
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refresh,
      client_id: CLIENT_ID,
    }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  storeTokens(data);
  return data.access_token;
}

export async function getNowPlaying(): Promise<NowPlaying | null> {
  const token = await accessToken();
  if (!token) return null;
  const res = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 204 || res.status > 400) return null; // nothing playing
  if (!res.ok) return null;
  const data = await res.json();
  if (!data?.item) return null;
  return {
    isPlaying: !!data.is_playing,
    title: data.item.name ?? '',
    artist: (data.item.artists ?? []).map((a: { name: string }) => a.name).join(', '),
    albumImage: data.item.album?.images?.[0]?.url ?? null,
    url: data.item.external_urls?.spotify ?? null,
  };
}

export function disconnectSpotify(): void {
  Object.values(K).forEach((k) => window.localStorage.removeItem(k));
}

/** @type {import('next').NextConfig} */

// Content Security Policy — only allow what HeyVanilla actually talks to:
// self, Supabase (db/auth/storage/realtime), Spotify (playback + images),
// OpenWeatherMap, TMDB posters, and Google avatars.
const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).host
  : '*.supabase.co';

const cspDirectives = [
  "default-src 'self'",
  // Next.js needs inline/eval in dev; tightened automatically in prod build.
  `script-src 'self' 'unsafe-inline' ${process.env.NODE_ENV === 'development' ? "'unsafe-eval'" : ''} https://sdk.scdn.co`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  `img-src 'self' blob: data: https://${supabaseHost} https://i.scdn.co https://image.tmdb.org https://lh3.googleusercontent.com https://openweathermap.org`,
  `connect-src 'self' https://${supabaseHost} wss://${supabaseHost} https://api.spotify.com https://accounts.spotify.com https://api.openweathermap.org https://api.themoviedb.org https://api.open-meteo.com https://geocoding-api.open-meteo.com https://api.bigdatacloud.net`,
  "media-src 'self' https://sdk.scdn.co",
  "frame-src 'self' https://sdk.scdn.co https://accounts.spotify.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
];

const securityHeaders = [
  { key: 'Content-Security-Policy', value: cspDirectives.join('; ') },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self)' },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
];

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  output: 'standalone', // small, self-contained server bundle for Docker/Railway
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: 'i.scdn.co' },
      { protocol: 'https', hostname: 'image.tmdb.org' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
  },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

// PWA wrapper — disabled in dev so it doesn't fight hot reload.
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
});

module.exports = withPWA(nextConfig);

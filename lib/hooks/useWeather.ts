'use client';

import { useEffect, useState } from 'react';

export interface WeatherNow {
  temp: number;
  description: string;
  emoji: string;
  isDay: boolean;
  city: string;
}

export type WeatherStatus = 'loading' | 'ready' | 'error';

// WMO weather interpretation codes → a friendly label + emoji.
// Open-Meteo returns these in current.weather_code. Reference:
// https://open-meteo.com/en/docs (WMO Weather interpretation codes)
function describe(code: number, isDay: boolean): { description: string; emoji: string } {
  const sun = isDay ? '☀️' : '🌙';
  const map: Record<number, { description: string; emoji: string }> = {
    0: { description: 'Clear sky', emoji: sun },
    1: { description: 'Mainly clear', emoji: isDay ? '🌤️' : '🌙' },
    2: { description: 'Partly cloudy', emoji: '⛅' },
    3: { description: 'Overcast', emoji: '☁️' },
    45: { description: 'Foggy', emoji: '🌫️' },
    48: { description: 'Rime fog', emoji: '🌫️' },
    51: { description: 'Light drizzle', emoji: '🌦️' },
    53: { description: 'Drizzle', emoji: '🌦️' },
    55: { description: 'Heavy drizzle', emoji: '🌧️' },
    56: { description: 'Freezing drizzle', emoji: '🌧️' },
    57: { description: 'Freezing drizzle', emoji: '🌧️' },
    61: { description: 'Light rain', emoji: '🌦️' },
    63: { description: 'Rain', emoji: '🌧️' },
    65: { description: 'Heavy rain', emoji: '🌧️' },
    66: { description: 'Freezing rain', emoji: '🌧️' },
    67: { description: 'Freezing rain', emoji: '🌧️' },
    71: { description: 'Light snow', emoji: '🌨️' },
    73: { description: 'Snow', emoji: '🌨️' },
    75: { description: 'Heavy snow', emoji: '❄️' },
    77: { description: 'Snow grains', emoji: '🌨️' },
    80: { description: 'Rain showers', emoji: '🌦️' },
    81: { description: 'Rain showers', emoji: '🌧️' },
    82: { description: 'Heavy showers', emoji: '⛈️' },
    85: { description: 'Snow showers', emoji: '🌨️' },
    86: { description: 'Snow showers', emoji: '❄️' },
    95: { description: 'Thunderstorm', emoji: '⛈️' },
    96: { description: 'Thunderstorm', emoji: '⛈️' },
    99: { description: 'Thunderstorm', emoji: '⛈️' },
  };
  return map[code] ?? { description: 'Clear', emoji: sun };
}

// Best-effort reverse geocode for a human city name (keyless). If it fails the
// weather still shows, just without the city line.
async function cityFor(lat: number, lon: number): Promise<string> {
  try {
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`
    );
    if (!res.ok) return '';
    const data = await res.json();
    return (
      data?.city ||
      data?.locality ||
      data?.principalSubdivision ||
      data?.countryName ||
      ''
    );
  } catch {
    return '';
  }
}

/** Live local weather with zero API key, via Open-Meteo. Tries geolocation,
 *  falls back to a sensible default. Reliable where OpenWeatherMap's free tier
 *  often 401s on new keys. */
export function useWeather(fallback = { lat: 18.5204, lon: 73.8567, city: 'Pune' }): {
  weather: WeatherNow | null;
  status: WeatherStatus;
} {
  const [weather, setWeather] = useState<WeatherNow | null>(null);
  const [status, setStatus] = useState<WeatherStatus>('loading');

  useEffect(() => {
    let cancelled = false;

    async function load(lat: number, lon: number, knownCity?: string) {
      try {
        const url =
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
          `&current=temperature_2m,is_day,weather_code&timezone=auto`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('weather fetch failed');
        const data = await res.json();
        const cur = data?.current ?? {};
        const isDay = cur.is_day === 1;
        const { description, emoji } = describe(Number(cur.weather_code ?? 0), isDay);
        let city = knownCity ?? '';
        if (!city) city = await cityFor(lat, lon);
        if (cancelled) return;
        setWeather({
          temp: Math.round(Number(cur.temperature_2m ?? 0)),
          description,
          emoji,
          isDay,
          city,
        });
        setStatus('ready');
      } catch {
        if (!cancelled) setStatus('error');
      }
    }

    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => load(pos.coords.latitude, pos.coords.longitude),
        () => load(fallback.lat, fallback.lon, fallback.city),
        { timeout: 8000, maximumAge: 30 * 60 * 1000 }
      );
    } else {
      load(fallback.lat, fallback.lon, fallback.city);
    }

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { weather, status };
}

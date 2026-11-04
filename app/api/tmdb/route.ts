import { NextResponse } from 'next/server';

// Looks up a poster for a movie or show. The TMDB key stays server-side; the
// client only ever sees the resulting image URL. Returns { poster_url: null }
// gracefully when no key is configured or nothing matches.
export async function GET(request: Request) {
  const key = process.env.TMDB_API_KEY;
  if (!key) return NextResponse.json({ poster_url: null });

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get('q') ?? '').trim();
  const type = searchParams.get('type') === 'show' ? 'tv' : 'movie';
  if (!q) return NextResponse.json({ poster_url: null });

  try {
    const url = `https://api.themoviedb.org/3/search/${type}?api_key=${key}&query=${encodeURIComponent(q)}`;
    const res = await fetch(url, { next: { revalidate: 0 } });
    if (!res.ok) return NextResponse.json({ poster_url: null });
    const data = await res.json();
    const poster = data?.results?.[0]?.poster_path as string | undefined;
    return NextResponse.json({
      poster_url: poster ? `https://image.tmdb.org/t/p/w342${poster}` : null,
    });
  } catch {
    return NextResponse.json({ poster_url: null });
  }
}

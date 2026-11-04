'use client';

import { useEffect, useState } from 'react';
import { useSupabase } from '@/components/providers/SupabaseProvider';

// The uploads bucket is private, so we display images via short-lived signed
// URLs. Stored values may be a storage path (new uploads), a (broken) public
// URL from before this fix, or an external http link — handle all three.
function toStoragePath(imageUrl: string): string | null {
  if (!imageUrl.startsWith('http')) return imageUrl; // already a path
  for (const marker of ['/object/public/uploads/', '/object/sign/uploads/', '/object/uploads/']) {
    const i = imageUrl.indexOf(marker);
    if (i >= 0) return imageUrl.slice(i + marker.length).split('?')[0] ?? null;
  }
  return null; // genuinely external link — use as-is
}

/** Resolves vision_board rows to displayable URLs, signing anything that lives
 *  in our private storage bucket. Returns a map of row id → usable image URL. */
export function useVisionUrls(rows: { id: string; image_url: string }[]): Record<string, string> {
  const { supabase } = useSupabase();
  const [urls, setUrls] = useState<Record<string, string>>({});
  const key = rows.map((r) => `${r.id}:${r.image_url}`).join('|');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const map: Record<string, string> = {};
      for (const r of rows) {
        const path = toStoragePath(r.image_url);
        if (path) {
          const { data } = await supabase.storage
            .from('uploads')
            .createSignedUrl(path, 60 * 60 * 24 * 7);
          map[r.id] = data?.signedUrl ?? r.image_url;
        } else {
          map[r.id] = r.image_url;
        }
      }
      if (!cancelled) setUrls(map);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase, key]);

  return urls;
}

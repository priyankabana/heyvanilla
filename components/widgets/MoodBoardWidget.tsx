'use client';

import Link from 'next/link';
import { Image as ImageIcon } from 'lucide-react';
import { useDashboard } from '@/features/dashboard/DashboardProvider';
import { useVisionUrls } from '@/lib/hooks/useVisionUrls';
import { WidgetShell } from './WidgetShell';

/** A little visual escape on the dashboard — a collage of whatever images you've
 *  added to your vision board. Pinterest saves, photos, anything. */
export function MoodBoardWidget() {
  const { vision } = useDashboard();
  const images = vision.rows.filter((v) => v.image_url).slice(0, 6);
  const urls = useVisionUrls(images);

  return (
    <WidgetShell icon={<ImageIcon size={16} />} title="Mood board" href="/vision">
      {images.length === 0 ? (
        <div className="flex h-full flex-col items-center justify-center text-center">
          <p className="text-sm text-text-secondary">Your visuals live here.</p>
          <Link href="/vision" className="mt-1 text-xs text-[var(--accent)] hover:underline">
            Add a few images →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-1.5">
          {images.map((v) =>
            urls[v.id] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={v.id}
                src={urls[v.id]}
                alt={v.caption ?? ''}
                className="aspect-square w-full rounded-lg object-cover"
              />
            ) : (
              <div key={v.id} className="skeleton aspect-square w-full rounded-lg" />
            )
          )}
        </div>
      )}
    </WidgetShell>
  );
}

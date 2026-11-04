'use client';

import { Sparkles } from 'lucide-react';
import { useDashboard } from '@/features/dashboard/DashboardProvider';
import type { Json } from '@/lib/supabase/types';
import { WidgetShell } from './WidgetShell';

function bodyOf(content: Json): string {
  if (content && typeof content === 'object' && !Array.isArray(content)) {
    const t = (content as Record<string, Json>).text;
    return typeof t === 'string' ? t : '';
  }
  return typeof content === 'string' ? content : '';
}

export function MemoriesWidget() {
  const { memory } = useDashboard();

  return (
    <WidgetShell icon={<Sparkles size={16} />} title="On this day" href="/journal">
      {!memory ? (
        <p className="text-sm text-text-secondary">
          No memory from a past year yet — keep journaling and they&apos;ll appear here. 🌱
        </p>
      ) : (
        <div>
          <p className="text-xs text-[var(--accent)]">
            {new Date(memory.created_at).toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
          <p className="mt-1 line-clamp-4 whitespace-pre-wrap text-sm italic leading-relaxed text-text-primary">
            &ldquo;{bodyOf(memory.content)}&rdquo;
          </p>
        </div>
      )}
    </WidgetShell>
  );
}

'use client';

import { Quote as QuoteIcon } from 'lucide-react';
import { useDailyQuote } from '@/lib/hooks/useDailyQuote';
import { WidgetShell } from './WidgetShell';

export function QuoteWidget() {
  const quote = useDailyQuote();

  return (
    <WidgetShell icon={<QuoteIcon size={16} />} title="Quote of the day">
      <div className="flex h-full flex-col justify-center">
        <p className="text-sm italic leading-relaxed text-text-primary">
          &ldquo;{quote.quote}&rdquo;
        </p>
        <p className="mt-2 text-xs text-text-secondary">— {quote.author}</p>
      </div>
    </WidgetShell>
  );
}

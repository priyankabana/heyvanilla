'use client';

// Friendly themed error boundary — never shows a raw stack trace.
export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-5 px-6 text-center">
      <div className="glass-card max-w-md p-8">
        <p
          className="text-text-primary"
          style={{ fontFamily: 'var(--font-playfair), serif', fontWeight: 400, fontSize: '1.75rem' }}
        >
          something wobbled.
        </p>
        <p className="mt-2 text-sm text-text-secondary">
          Not your fault. Take a breath and try again — don&apos;t melt. 🍦
        </p>
        <button
          onClick={reset}
          className="mt-6 rounded-[var(--radius)] bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-white transition-colors duration-200 hover:bg-[var(--accent-dark)]"
        >
          try again
        </button>
      </div>
    </main>
  );
}

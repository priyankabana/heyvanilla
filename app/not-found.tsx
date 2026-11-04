import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 px-6 text-center">
      <p
        className="text-text-primary"
        style={{
          fontFamily: 'var(--font-playfair), serif',
          fontWeight: 400,
          fontSize: 'clamp(2rem, 9vw, 3.5rem)',
        }}
      >
        oops. still, don&apos;t melt. 🍦
      </p>
      <Link
        href="/"
        className="rounded-[var(--radius)] bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-white transition-colors duration-200 hover:bg-[var(--accent-dark)]"
      >
        back to home
      </Link>
    </main>
  );
}

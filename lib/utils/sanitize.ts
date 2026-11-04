// Server-side input hardening. We never render user HTML, but we still strip
// tags and trim everything before it touches the database — defence in depth.
export function sanitizeText(input: unknown): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/<[^>]*>/g, '') // strip any HTML tags
    .replace(/\u0000/g, '') // strip null bytes
    .trim();
}

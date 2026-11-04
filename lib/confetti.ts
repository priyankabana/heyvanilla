import confetti from 'canvas-confetti';

// Reads the live theme accent so the celebration matches whatever aesthetic
// the user is on. Fires a soft two-burst from the centre.
function themeColors(): string[] {
  if (typeof window === 'undefined') return ['#bc335f', '#ecabc9', '#fff8f0'];
  const css = getComputedStyle(document.documentElement);
  const get = (v: string, fallback: string) => css.getPropertyValue(v).trim() || fallback;
  return [
    get('--accent', '#bc335f'),
    get('--accent-light', '#ecabc9'),
    get('--accent-dark', '#8e2247'),
    '#FFF8F0',
  ];
}

export function celebrate(): void {
  const colors = themeColors();
  confetti({ particleCount: 90, spread: 70, startVelocity: 42, origin: { y: 0.6 }, colors, scalar: 0.9 });
  setTimeout(() => {
    confetti({ particleCount: 50, angle: 60, spread: 55, origin: { x: 0 }, colors, scalar: 0.85 });
    confetti({ particleCount: 50, angle: 120, spread: 55, origin: { x: 1 }, colors, scalar: 0.85 });
  }, 180);
}

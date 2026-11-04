// Tiny classname joiner. Keeps JSX clean without pulling in a dependency.
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}

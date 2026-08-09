/** Case-insensitive string equality. */
export const eqi = (a: string, b: string): boolean =>
  a.toLowerCase() === b.toLowerCase();

/** Lowercase a string. */
export const lc = (s: string): string => s.toLowerCase();

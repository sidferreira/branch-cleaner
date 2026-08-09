const DAY_MS = 24 * 60 * 60 * 1000;
const DAY_SECONDS = 24 * 60 * 60;

/**
 * Render an ISO timestamp as a coarse "Nd ago" label. `now` is injectable so
 * the output is deterministic in tests.
 */
export function humanizeDaysAgo(
  iso: string | null,
  now: number = Date.now(),
): string {
  if (iso === null) return '';
  const days = Math.floor((now - Date.parse(iso)) / DAY_MS);
  if (days <= 0) return 'today';
  if (days === 1) return '1d ago';
  return `${days}d ago`;
}

/** Whole days between a unix-seconds timestamp and `now`. */
export function daysSinceUnix(
  unixSeconds: number,
  now: number = Date.now(),
): number {
  return Math.floor((now / 1000 - unixSeconds) / DAY_SECONDS);
}

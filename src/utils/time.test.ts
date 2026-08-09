import { describe, expect, it } from 'vitest';

import { daysSinceUnix, humanizeDaysAgo } from './time';

// Fixed reference instant: 2026-01-15T00:00:00Z
const NOW = Date.parse('2026-01-15T00:00:00Z');

describe('humanizeDaysAgo', () => {
  it('returns empty string for null', () => {
    expect(humanizeDaysAgo(null, NOW)).toBe('');
  });

  it('returns "today" for the same day', () => {
    expect(humanizeDaysAgo('2026-01-15T00:00:00Z', NOW)).toBe('today');
  });

  it('returns "today" for a future timestamp', () => {
    expect(humanizeDaysAgo('2026-01-20T00:00:00Z', NOW)).toBe('today');
  });

  it('returns "1d ago" for exactly one day', () => {
    expect(humanizeDaysAgo('2026-01-14T00:00:00Z', NOW)).toBe('1d ago');
  });

  it('returns "Nd ago" for older timestamps', () => {
    expect(humanizeDaysAgo('2026-01-05T00:00:00Z', NOW)).toBe('10d ago');
  });
});

describe('daysSinceUnix', () => {
  it('counts whole days elapsed', () => {
    const tenDaysAgo = NOW / 1000 - 10 * 24 * 60 * 60;
    expect(daysSinceUnix(tenDaysAgo, NOW)).toBe(10);
  });

  it('floors partial days', () => {
    const almostTwoDays = NOW / 1000 - (2 * 24 * 60 * 60 - 1);
    expect(daysSinceUnix(almostTwoDays, NOW)).toBe(1);
  });

  it('returns 0 for now', () => {
    expect(daysSinceUnix(NOW / 1000, NOW)).toBe(0);
  });
});

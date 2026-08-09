import { describe, expect, it } from 'vitest';

import { mapWithConcurrency } from './concurrency';

describe('mapWithConcurrency', () => {
  it('preserves input order in results', async () => {
    const items = [10, 20, 30, 40];
    const out = await mapWithConcurrency(items, 2, async (n) => n * 2);
    expect(out).toEqual([20, 40, 60, 80]);
  });

  it('passes the index to the worker', async () => {
    const out = await mapWithConcurrency(['a', 'b', 'c'], 3, async (_, i) => i);
    expect(out).toEqual([0, 1, 2]);
  });

  it('never exceeds the concurrency limit', async () => {
    let active = 0;
    let peak = 0;
    const items = Array.from({ length: 12 }, (_, i) => i);
    await mapWithConcurrency(items, 3, async () => {
      active += 1;
      peak = Math.max(peak, active);
      await new Promise((r) => setTimeout(r, 5));
      active -= 1;
    });
    expect(peak).toBeLessThanOrEqual(3);
  });

  it('handles an empty list', async () => {
    const out = await mapWithConcurrency([], 4, async (n) => n);
    expect(out).toEqual([]);
  });
});

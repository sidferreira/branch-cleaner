import { afterEach, describe, expect, it, vi } from 'vitest';

import { parseArgs } from './args';

describe('parseArgs', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('uses defaults when no args are given', () => {
    expect(parseArgs([])).toEqual({ days: 30, staleDays: 30 });
  });

  it('parses --days and --stale-days', () => {
    expect(parseArgs(['--days=7', '--stale-days=90'])).toEqual({
      days: 7,
      staleDays: 90,
    });
  });

  it('exits 0 on --help', () => {
    const exit = vi
      .spyOn(process, 'exit')
      .mockImplementation((() => {
        throw new Error('exit');
      }) as (code?: number) => never);
    vi.spyOn(console, 'log').mockImplementation(() => {});

    expect(() => parseArgs(['--help'])).toThrow('exit');
    expect(exit).toHaveBeenCalledWith(0);
  });

  it('exits 1 on an unknown argument', () => {
    const exit = vi
      .spyOn(process, 'exit')
      .mockImplementation((() => {
        throw new Error('exit');
      }) as (code?: number) => never);
    vi.spyOn(console, 'log').mockImplementation(() => {});

    expect(() => parseArgs(['--nope'])).toThrow('exit');
    expect(exit).toHaveBeenCalledWith(1);
  });
});

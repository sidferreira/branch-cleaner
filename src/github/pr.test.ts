import { describe, expect, it } from 'vitest';

import type { PullRequest } from '../types';
import { isAuthor, isPullRequest, parsePrList, pickBestPr } from './pr';

function pr(overrides: Partial<PullRequest> = {}): PullRequest {
  return {
    number: 1,
    title: 'A PR',
    state: 'OPEN',
    headRefName: 'feature/x',
    closedAt: null,
    mergedAt: null,
    url: 'https://example.com/pr/1',
    author: { login: 'alice' },
    isDraft: false,
    ...overrides,
  };
}

describe('isAuthor', () => {
  it('accepts an object with a login string', () => {
    expect(isAuthor({ login: 'alice' })).toBe(true);
  });

  it('rejects non-objects and missing login', () => {
    expect(isAuthor(null)).toBe(false);
    expect(isAuthor('alice')).toBe(false);
    expect(isAuthor({})).toBe(false);
    expect(isAuthor({ login: 42 })).toBe(false);
  });
});

describe('isPullRequest', () => {
  it('accepts a well-formed PR', () => {
    expect(isPullRequest(pr())).toBe(true);
  });

  it('rejects an invalid state', () => {
    expect(isPullRequest({ ...pr(), state: 'DRAFT' })).toBe(false);
  });

  it('rejects a missing author', () => {
    const { author: _author, ...rest } = pr();
    expect(isPullRequest(rest)).toBe(false);
  });
});

describe('parsePrList', () => {
  it('keeps valid entries and drops malformed ones', () => {
    const json = JSON.stringify([pr({ number: 1 }), { number: 'nope' }]);
    const parsed = parsePrList(json);
    expect(parsed).toHaveLength(1);
    expect(parsed[0]!.number).toBe(1);
  });

  it('throws when the payload is not an array', () => {
    expect(() => parsePrList('{}')).toThrow(/expected an array/);
  });
});

describe('pickBestPr', () => {
  it('returns null for an empty list', () => {
    expect(pickBestPr([])).toBeNull();
  });

  it('prefers MERGED over CLOSED over OPEN', () => {
    const best = pickBestPr([
      pr({ number: 1, state: 'OPEN' }),
      pr({ number: 2, state: 'CLOSED' }),
      pr({ number: 3, state: 'MERGED' }),
    ]);
    expect(best!.number).toBe(3);
  });

  it('breaks state ties by highest PR number', () => {
    const best = pickBestPr([
      pr({ number: 5, state: 'CLOSED' }),
      pr({ number: 9, state: 'CLOSED' }),
      pr({ number: 7, state: 'CLOSED' }),
    ]);
    expect(best!.number).toBe(9);
  });
});

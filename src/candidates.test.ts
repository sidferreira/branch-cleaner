import { describe, expect, it, vi } from 'vitest';

import { buildCandidates, reasonForPr } from './candidates';
import type { LocalBranch, PullRequest } from './types';

// Silence the progress logging that buildCandidates emits.
vi.mock('./utils/logger', () => ({
  logger: {
    log: () => {},
    info: () => {},
    warn: () => {},
    error: () => {},
    debug: () => {},
    setCommandVersion: () => {},
  },
}));

// Fixed reference instant: 2026-01-15T00:00:00Z
const NOW = Date.parse('2026-01-15T00:00:00Z');
const DAY = 24 * 60 * 60;

function pr(overrides: Partial<PullRequest> = {}): PullRequest {
  return {
    number: 1,
    title: 'A PR',
    state: 'MERGED',
    headRefName: 'feature/x',
    closedAt: null,
    mergedAt: '2026-01-12T00:00:00Z',
    url: 'https://example.com/pr/1',
    author: { login: 'me' },
    isDraft: false,
    ...overrides,
  };
}

function branch(overrides: Partial<LocalBranch> = {}): LocalBranch {
  return {
    name: 'feature/x',
    upstream: 'origin/feature/x',
    track: '',
    isCurrent: false,
    lastCommitUnix: NOW / 1000,
    ...overrides,
  };
}

const noLookup = async (): Promise<PullRequest[]> => [];

describe('reasonForPr', () => {
  it('labels my merged PR', () => {
    const r = reasonForPr(pr({ number: 10, state: 'MERGED' }), 'me', NOW);
    expect(r).toEqual({
      reason: 'PR #10 merged 3d ago (mine)',
      category: 'mine-closed',
    });
  });

  it('labels someone else\'s closed PR', () => {
    const r = reasonForPr(
      pr({
        number: 5,
        state: 'CLOSED',
        mergedAt: null,
        closedAt: '2026-01-10T00:00:00Z',
        author: { login: 'bob' },
      }),
      'me',
      NOW,
    );
    expect(r).toEqual({
      reason: 'PR #5 closed 5d ago by bob',
      category: 'review-closed',
    });
  });

  it('labels my draft PR', () => {
    const r = reasonForPr(pr({ number: 7, state: 'OPEN', isDraft: true }), 'me', NOW);
    expect(r).toEqual({ reason: 'PR #7 draft (mine)', category: 'mine-draft' });
  });

  it('labels an open review PR', () => {
    const r = reasonForPr(
      pr({ number: 8, state: 'OPEN', author: { login: 'bob' } }),
      'me',
      NOW,
    );
    expect(r).toEqual({ reason: 'PR #8 open by bob', category: 'review-open' });
  });
});

describe('buildCandidates', () => {
  it('matches a branch to my bulk-fetched closed PR', async () => {
    const out = await buildCandidates(
      [branch({ name: 'feature/x' })],
      [pr({ number: 10, state: 'MERGED', headRefName: 'feature/x' })],
      'me',
      new Set(['feature/x']),
      30,
      { lookupPrsForBranch: noLookup, now: NOW },
    );
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({
      branch: 'feature/x',
      category: 'mine-closed',
      prNumber: 10,
      remoteExists: true,
    });
  });

  it('excludes the current branch and protected branches', async () => {
    const out = await buildCandidates(
      [
        branch({ name: 'main' }),
        branch({ name: 'master' }),
        branch({ name: 'feature/x', isCurrent: true }),
      ],
      [],
      'me',
      new Set(),
      30,
      { lookupPrsForBranch: noLookup, now: NOW },
    );
    expect(out).toEqual([]);
  });

  it('falls back to a per-branch lookup for unmatched branches', async () => {
    const lookup = vi.fn(async (name: string) =>
      name === 'review/pr'
        ? [
            pr({
              number: 5,
              state: 'CLOSED',
              mergedAt: null,
              closedAt: '2026-01-10T00:00:00Z',
              headRefName: 'review/pr',
              author: { login: 'bob' },
            }),
          ]
        : [],
    );
    const out = await buildCandidates(
      [branch({ name: 'review/pr', upstream: 'origin/review/pr' })],
      [],
      'me',
      new Set(),
      30,
      { lookupPrsForBranch: lookup, now: NOW },
    );
    expect(lookup).toHaveBeenCalledWith('review/pr');
    expect(out[0]).toMatchObject({ category: 'review-closed', prNumber: 5 });
  });

  it('categorizes orphan, local-only, and stale branches with no PR', async () => {
    const out = await buildCandidates(
      [
        branch({ name: 'orphan', track: '[gone]' }),
        branch({ name: 'local', upstream: '', lastCommitUnix: NOW / 1000 - 2 * DAY }),
        branch({
          name: 'stale',
          lastCommitUnix: NOW / 1000 - 40 * DAY,
        }),
      ],
      [],
      'me',
      new Set(),
      30,
      { lookupPrsForBranch: noLookup, now: NOW },
    );
    const byName = Object.fromEntries(out.map((c) => [c.branch, c]));
    expect(byName.orphan).toMatchObject({
      category: 'orphan-only',
      reason: 'orphaned (remote gone)',
    });
    expect(byName.local).toMatchObject({
      category: 'local-only',
      reason: 'local-only (never pushed), last commit 2d ago',
    });
    expect(byName.stale).toMatchObject({
      category: 'stale',
      reason: 'stale: last commit 40d ago, no PR',
    });
  });

  it('does not surface a fresh branch with an upstream and no PR', async () => {
    const out = await buildCandidates(
      [branch({ name: 'fresh', lastCommitUnix: NOW / 1000 - 5 * DAY })],
      [],
      'me',
      new Set(),
      30,
      { lookupPrsForBranch: noLookup, now: NOW },
    );
    expect(out).toEqual([]);
  });

  it('appends an orphan marker when a matched PR branch is also orphaned', async () => {
    const out = await buildCandidates(
      [branch({ name: 'feature/x', track: '[gone]' })],
      [pr({ number: 10, state: 'MERGED', headRefName: 'feature/x' })],
      'me',
      new Set(),
      30,
      { lookupPrsForBranch: noLookup, now: NOW },
    );
    expect(out[0]!.reason).toBe('PR #10 merged 3d ago (mine) · orphan');
  });

  it('sorts by category priority, then branch name', async () => {
    const out = await buildCandidates(
      [
        branch({ name: 'zzz-stale', lastCommitUnix: NOW / 1000 - 40 * DAY }),
        branch({ name: 'orphan-b', track: '[gone]' }),
        branch({ name: 'orphan-a', track: '[gone]' }),
      ],
      [],
      'me',
      new Set(),
      30,
      { lookupPrsForBranch: noLookup, now: NOW },
    );
    expect(out.map((c) => c.branch)).toEqual([
      'orphan-a',
      'orphan-b',
      'zzz-stale',
    ]);
  });
});

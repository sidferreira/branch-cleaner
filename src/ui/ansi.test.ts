import { describe, expect, it } from 'vitest';

import type { Candidate } from '../types';
import { ANSI, decorateReason, hyperlink } from './ansi';

function candidate(overrides: Partial<Candidate> = {}): Candidate {
  return {
    branch: 'feature/x',
    reason: 'PR #42 merged 3d ago (mine)',
    remoteExists: false,
    category: 'mine-closed',
    prNumber: 42,
    prUrl: 'https://example.com/pr/42',
    ...overrides,
  };
}

describe('hyperlink', () => {
  it('wraps text in an OSC 8 escape sequence', () => {
    expect(hyperlink('#42', 'https://example.com')).toBe(
      '\x1b]8;;https://example.com\x1b\\#42\x1b]8;;\x1b\\',
    );
  });
});

describe('decorateReason', () => {
  it('turns the PR number into a cyan hyperlink', () => {
    const out = decorateReason(candidate());
    expect(out).toContain(ANSI.cyan);
    expect(out).toContain(hyperlink('#42', 'https://example.com/pr/42'));
    expect(out).toContain(ANSI.reset);
  });

  it('returns the reason untouched when there is no PR', () => {
    const reason = 'orphaned (remote gone)';
    const out = decorateReason(
      candidate({ reason, prNumber: null, prUrl: null }),
    );
    expect(out).toBe(reason);
  });
});

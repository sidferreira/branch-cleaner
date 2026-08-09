import { describe, expect, it } from 'vitest';

import { parseLocalBranches, parseRemoteBranches } from './branches';

describe('parseLocalBranches', () => {
  it('parses each field and flags the current branch', () => {
    const output = [
      'main|origin/main|=|1700000000',
      'feature/x|origin/feature/x|[gone]|1699000000',
    ].join('\n');

    const branches = parseLocalBranches(output, 'feature/x');

    expect(branches).toEqual([
      {
        name: 'main',
        upstream: 'origin/main',
        track: '=',
        isCurrent: false,
        lastCommitUnix: 1700000000,
      },
      {
        name: 'feature/x',
        upstream: 'origin/feature/x',
        track: '[gone]',
        isCurrent: true,
        lastCommitUnix: 1699000000,
      },
    ]);
  });

  it('defaults missing fields for a local-only branch', () => {
    const branches = parseLocalBranches('wip|||1699000000', '');
    expect(branches[0]).toMatchObject({
      name: 'wip',
      upstream: '',
      track: '',
      lastCommitUnix: 1699000000,
    });
  });

  it('ignores blank lines', () => {
    expect(parseLocalBranches('\n\n', 'main')).toEqual([]);
  });
});

describe('parseRemoteBranches', () => {
  it('strips the origin/ prefix and lowercases', () => {
    const set = parseRemoteBranches('origin/Main\norigin/Feature/ABC');
    expect(set.has('main')).toBe(true);
    expect(set.has('feature/abc')).toBe(true);
    expect(set.size).toBe(2);
  });

  it('ignores blank lines', () => {
    expect(parseRemoteBranches('\n').size).toBe(0);
  });
});

import { run } from '../utils/exec';
import { lc } from '../utils/text';
import type { LocalBranch } from '../types';

export const LOCAL_BRANCH_FORMAT =
  '%(refname:short)|%(upstream:short)|%(upstream:track)|%(committerdate:unix)';

/** Parse the pipe-delimited `git for-each-ref refs/heads` output. */
export function parseLocalBranches(
  output: string,
  currentBranch: string,
): LocalBranch[] {
  return output
    .split('\n')
    .filter((line) => line.length > 0)
    .map((line) => {
      const [name = '', upstream = '', track = '', ts = '0'] = line.split('|');
      return {
        name,
        upstream,
        track,
        isCurrent: name === currentBranch,
        lastCommitUnix: Number(ts),
      };
    });
}

/** Parse `git for-each-ref refs/remotes/origin` into a lowercased branch-name set. */
export function parseRemoteBranches(output: string): Set<string> {
  return new Set(
    output
      .split('\n')
      .filter((line) => line.length > 0)
      .map((line) => lc(line.replace(/^origin\//, ''))),
  );
}

export function getCurrentBranch(): string {
  return run('git', ['rev-parse', '--abbrev-ref', 'HEAD']).trim();
}

export function listLocalBranches(currentBranch: string): LocalBranch[] {
  const output = run('git', [
    'for-each-ref',
    'refs/heads',
    `--format=${LOCAL_BRANCH_FORMAT}`,
  ]);
  return parseLocalBranches(output, currentBranch);
}

export function listRemoteBranches(): Set<string> {
  const output = run('git', [
    'for-each-ref',
    'refs/remotes/origin',
    '--format=%(refname:short)',
  ]);
  return parseRemoteBranches(output);
}

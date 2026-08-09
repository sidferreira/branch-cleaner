import { run, runAsync } from '../utils/exec';
import type { Author, PullRequest } from '../types';

export const PR_JSON_FIELDS =
  'number,title,state,headRefName,closedAt,mergedAt,url,author,isDraft';

export function isAuthor(value: unknown): value is Author {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return typeof v.login === 'string';
}

export function isPullRequest(value: unknown): value is PullRequest {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.number === 'number' &&
    typeof v.title === 'string' &&
    (v.state === 'OPEN' || v.state === 'CLOSED' || v.state === 'MERGED') &&
    typeof v.headRefName === 'string' &&
    (v.closedAt === null || typeof v.closedAt === 'string') &&
    (v.mergedAt === null || typeof v.mergedAt === 'string') &&
    typeof v.url === 'string' &&
    isAuthor(v.author) &&
    typeof v.isDraft === 'boolean'
  );
}

/** Parse a `gh pr list --json` array, dropping any malformed entries. */
export function parsePrList(output: string): PullRequest[] {
  const parsed: unknown = JSON.parse(output);
  if (!Array.isArray(parsed)) {
    throw new Error('Unexpected gh output: expected an array.');
  }
  const prs: PullRequest[] = [];
  for (const item of parsed) {
    if (isPullRequest(item)) prs.push(item);
  }
  return prs;
}

/** Pick the most "settled" PR: MERGED > CLOSED > OPEN, then highest number. */
export function pickBestPr(prs: readonly PullRequest[]): PullRequest | null {
  if (prs.length === 0) return null;
  const rank = (s: PullRequest['state']): number =>
    s === 'MERGED' ? 0 : s === 'CLOSED' ? 1 : 2;
  return [...prs].sort((a, b) => {
    const r = rank(a.state) - rank(b.state);
    return r !== 0 ? r : b.number - a.number;
  })[0]!;
}

export function getViewerLogin(): string {
  return run('gh', ['api', 'user', '--jq', '.login']).trim();
}

export function fetchMyClosedPrs(
  days: number,
  now: number = Date.now(),
): PullRequest[] {
  const since = new Date(now - days * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  const output = run('gh', [
    'pr',
    'list',
    '--author',
    '@me',
    '--state',
    'all',
    '--search',
    `closed:>=${since}`,
    '--json',
    PR_JSON_FIELDS,
    '--limit',
    '200',
  ]);
  return parsePrList(output);
}

export async function lookupPrsForBranch(branch: string): Promise<PullRequest[]> {
  const output = await runAsync('gh', [
    'pr',
    'list',
    '--head',
    branch,
    '--state',
    'all',
    '--json',
    PR_JSON_FIELDS,
    '--limit',
    '10',
  ]);
  return parsePrList(output);
}

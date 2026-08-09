import { pickBestPr } from './github/pr';
import type { Candidate, Category, LocalBranch, PullRequest } from './types';
import { mapWithConcurrency } from './utils/concurrency';
import { logger } from './utils/logger';
import { eqi, lc } from './utils/text';
import { daysSinceUnix, humanizeDaysAgo } from './utils/time';

export const PROTECTED_BRANCHES = new Set(['main', 'master']);

export const CATEGORY_ORDER: Record<Category, number> = {
  'mine-closed': 0,
  'review-closed': 1,
  'orphan-only': 2,
  stale: 3,
  'local-only': 4,
  'mine-draft': 5,
  'review-draft': 6,
  'review-open': 7,
  'mine-open': 8,
};

/** Human-readable reason + category for a branch that has a matching PR. */
export function reasonForPr(
  pr: PullRequest,
  viewer: string,
  now: number = Date.now(),
): { reason: string; category: Category } {
  const isMine = eqi(pr.author.login, viewer);
  const owner = isMine ? '(mine)' : `by ${pr.author.login}`;
  if (pr.state === 'OPEN') {
    if (pr.isDraft) {
      return {
        reason: `PR #${pr.number} draft ${owner}`,
        category: isMine ? 'mine-draft' : 'review-draft',
      };
    }
    return {
      reason: `PR #${pr.number} open ${owner}`,
      category: isMine ? 'mine-open' : 'review-open',
    };
  }
  const when = humanizeDaysAgo(pr.mergedAt ?? pr.closedAt, now);
  const verb = pr.state === 'MERGED' ? 'merged' : 'closed';
  return {
    reason: `PR #${pr.number} ${verb} ${when} ${owner}`,
    category: isMine ? 'mine-closed' : 'review-closed',
  };
}

export interface BuildCandidatesDeps {
  /** Per-branch PR lookup for branches not matched by the bulk query. */
  lookupPrsForBranch: (branch: string) => Promise<PullRequest[]>;
  /** Injectable clock for deterministic "Nd ago" / staleness math. */
  now?: number;
  /** Parallelism for the per-branch lookup. */
  concurrency?: number;
}

/**
 * Categorize local branches into deletion candidates. Bulk-matched PRs win;
 * unmatched branches fall back to a per-branch lookup, then orphan / local-only
 * / stale heuristics. Sorted by category, then branch name.
 */
export async function buildCandidates(
  branches: readonly LocalBranch[],
  myPrs: readonly PullRequest[],
  viewer: string,
  remoteBranches: ReadonlySet<string>,
  staleDays: number,
  deps: BuildCandidatesDeps,
): Promise<Candidate[]> {
  const now = deps.now ?? Date.now();
  const concurrency = deps.concurrency ?? 5;

  const myPrByHead = new Map<string, PullRequest>();
  for (const pr of myPrs) {
    if (pr.state === 'OPEN') continue;
    const key = lc(pr.headRefName);
    const existing = myPrByHead.get(key);
    if (existing === undefined || pr.number > existing.number) {
      myPrByHead.set(key, pr);
    }
  }

  const filtered = branches.filter(
    (b) => !b.isCurrent && !PROTECTED_BRANCHES.has(b.name),
  );
  const unmatched = filtered.filter((b) => !myPrByHead.has(lc(b.name)));

  const lookupResults = new Map<string, PullRequest | null>();
  if (unmatched.length > 0) {
    logger.info(
      `Looking up PRs for ${unmatched.length} unmatched branch(es) (${concurrency} in parallel)…`,
    );
    let completed = 0;
    const pairs = await mapWithConcurrency(
      unmatched,
      concurrency,
      async (branch): Promise<readonly [string, PullRequest | null]> => {
        try {
          const prs = await deps.lookupPrsForBranch(branch.name);
          completed += 1;
          logger.debug(`  [${completed}/${unmatched.length}] ${branch.name}`);
          return [branch.name, pickBestPr(prs)];
        } catch (err) {
          completed += 1;
          const msg = err instanceof Error ? err.message : String(err);
          logger.warn(
            `  [${completed}/${unmatched.length}] lookup failed for ${branch.name}: ${msg}`,
          );
          return [branch.name, null];
        }
      },
    );
    for (const [name, pr] of pairs) {
      lookupResults.set(name, pr);
    }
  }

  const candidates: Candidate[] = [];
  for (const branch of filtered) {
    const remoteExists = remoteBranches.has(lc(branch.name));
    const isOrphan = branch.track.includes('gone');
    const hasUpstream = branch.upstream.length > 0;
    const age = daysSinceUnix(branch.lastCommitUnix, now);

    const myPr = myPrByHead.get(lc(branch.name));
    const fallbackPr = lookupResults.get(branch.name) ?? null;
    const pr = myPr ?? fallbackPr;

    let reason: string | null = null;
    let category: Category | null = null;

    if (pr !== null && pr !== undefined) {
      ({ reason, category } = reasonForPr(pr, viewer, now));
      if (isOrphan) reason = `${reason} · orphan`;
    } else if (isOrphan) {
      reason = 'orphaned (remote gone)';
      category = 'orphan-only';
    } else if (!hasUpstream) {
      reason = `local-only (never pushed), last commit ${age}d ago`;
      category = 'local-only';
    } else if (age >= staleDays) {
      reason = `stale: last commit ${age}d ago, no PR`;
      category = 'stale';
    }

    if (reason !== null && category !== null) {
      candidates.push({
        branch: branch.name,
        reason,
        remoteExists,
        category,
        prNumber: pr?.number ?? null,
        prUrl: pr?.url ?? null,
      });
    }
  }

  candidates.sort((a, b) => {
    const c = CATEGORY_ORDER[a.category] - CATEGORY_ORDER[b.category];
    return c !== 0 ? c : a.branch.localeCompare(b.branch);
  });
  return candidates;
}

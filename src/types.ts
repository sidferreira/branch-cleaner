export interface Author {
  login: string;
}

export interface PullRequest {
  number: number;
  title: string;
  state: 'OPEN' | 'CLOSED' | 'MERGED';
  headRefName: string;
  closedAt: string | null;
  mergedAt: string | null;
  url: string;
  author: Author;
  isDraft: boolean;
}

export interface LocalBranch {
  name: string;
  upstream: string;
  track: string;
  isCurrent: boolean;
  lastCommitUnix: number;
}

export type Category =
  | 'mine-closed'
  | 'review-closed'
  | 'orphan-only'
  | 'stale'
  | 'local-only'
  | 'mine-draft'
  | 'review-draft'
  | 'review-open'
  | 'mine-open';

export interface Candidate {
  branch: string;
  reason: string;
  remoteExists: boolean;
  category: Category;
  prNumber: number | null;
  prUrl: string | null;
}

export interface Args {
  days: number;
  staleDays: number;
}

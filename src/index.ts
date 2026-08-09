import { buildCandidates } from './candidates';
import { parseArgs } from './cli/args';
import {
  getCurrentBranch,
  listLocalBranches,
  listRemoteBranches,
} from './git/branches';
import {
  fetchMyClosedPrs,
  getViewerLogin,
  lookupPrsForBranch,
} from './github/pr';
import { ensurePrereqs, run } from './utils/exec';
import { logger } from './utils/logger';
import { formatMultiline } from './ui/output';
import { pickBranches, restoreTty } from './ui/picker';

async function main(): Promise<void> {
  const { days, staleDays } = parseArgs();
  ensurePrereqs();

  process.on('SIGINT', () => {
    restoreTty();
    logger.log('\nCancelled.');
    process.exit(0);
  });

  logger.info('Fetching remote refs (git fetch --prune)…');
  run('git', ['fetch', '--prune']);

  logger.info(`Loading your PRs closed in last ${days} day(s)…`);
  const myPrs = fetchMyClosedPrs(days);
  const viewer = getViewerLogin();

  const currentBranch = getCurrentBranch();
  const branches = listLocalBranches(currentBranch);
  const remoteBranches = listRemoteBranches();
  const candidates = await buildCandidates(
    branches,
    myPrs,
    viewer,
    remoteBranches,
    staleDays,
    { lookupPrsForBranch },
  );

  if (candidates.length === 0) {
    logger.log('Nothing to clean up. ✨');
    return;
  }

  const picked = await pickBranches(candidates);
  if (picked.length === 0) {
    logger.log('No branches selected.');
    return;
  }

  const names = picked.map((p) => p.branch);
  const remoteStillExists = picked
    .filter((p) => p.remoteExists)
    .map((p) => p.branch);

  logger.log('\nRun this to delete the selected branches:\n');
  logger.log(`${formatMultiline('git branch -D', names)}\n`);
  if (remoteStillExists.length > 0) {
    logger.warn(
      `remote branch still exists for: ${remoteStillExists.join(', ')}`,
    );
    logger.log('\nIf you also want to delete them on origin:\n');
    logger.log(
      `${formatMultiline('git push origin --delete', remoteStillExists)}\n`,
    );
  }
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  logger.error(`\n${message}`);
  process.exit(1);
});

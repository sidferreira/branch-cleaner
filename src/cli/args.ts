import { logger } from '../utils/logger';
import type { Args } from '../types';

export function printHelpAndExit(code: number): never {
  logger.log(`Usage: npx branch-cleaner [--days=N] [--stale-days=N]

Surfaces local branches that are safe to delete:
  • Your own PRs merged or closed in the last --days days (bulk lookup)
  • Other branches whose PR (yours or someone else's) is matched via per-branch
    lookup — handles old branches, review checkouts, and abandoned work
  • Local branches whose remote tracking ref is gone (orphan)
  • Branches with no matching PR whose last commit is older than --stale-days

You toggle which to remove; the script prints a ready-to-paste \`git branch -D\`
command. Nothing is deleted automatically.

Options:
  --days=N         Date window for your closed PRs (default: 30)
  --stale-days=N   Age cutoff for "no PR + old commit" (default: 30)
  -h, --help       Show this message`);
  process.exit(code);
}

/**
 * Parse CLI flags. `argv` defaults to the process args but is injectable for
 * testing. Unknown flags and `--help` terminate the process via
 * {@link printHelpAndExit}.
 */
export function parseArgs(argv: readonly string[] = process.argv.slice(2)): Args {
  let days = 30;
  let staleDays = 30;
  for (const arg of argv) {
    const daysMatch = arg.match(/^--days=(\d+)$/);
    const staleMatch = arg.match(/^--stale-days=(\d+)$/);
    if (daysMatch !== null) {
      days = Number(daysMatch[1]);
    } else if (staleMatch !== null) {
      staleDays = Number(staleMatch[1]);
    } else if (arg === '-h' || arg === '--help') {
      printHelpAndExit(0);
    } else {
      logger.error(`Unknown argument: ${arg}`);
      printHelpAndExit(1);
    }
  }
  return { days, staleDays };
}

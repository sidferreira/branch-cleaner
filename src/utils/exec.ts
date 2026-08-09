import { execSync, spawn, spawnSync } from 'node:child_process';

import { logger } from './logger';

/** Run a command synchronously, throwing on a non-zero exit. */
export function run(cmd: string, args: readonly string[]): string {
  const result = spawnSync(cmd, args, { encoding: 'utf8' });
  if (result.status !== 0) {
    throw new Error(
      `\`${cmd} ${args.join(' ')}\` failed (exit ${result.status}):\n${
        result.stderr
      }`,
    );
  }
  return result.stdout;
}

/** Run a command asynchronously, resolving with stdout or rejecting on failure. */
export function runAsync(cmd: string, args: readonly string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args);
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk: Buffer) => {
      stdout += chunk.toString('utf8');
    });
    child.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString('utf8');
    });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolve(stdout);
      else
        reject(
          new Error(
            `\`${cmd} ${args.join(' ')}\` failed (exit ${code}):\n${stderr}`,
          ),
        );
    });
  });
}

/** Exit early with a friendly message if git or gh prerequisites are missing. */
export function ensurePrereqs(): void {
  try {
    execSync('git rev-parse --is-inside-work-tree', { stdio: 'ignore' });
  } catch {
    logger.error('Must be run from inside a git repository.');
    process.exit(1);
  }
  try {
    execSync('gh auth status', { stdio: 'ignore' });
  } catch {
    logger.error('GitHub CLI not authenticated. Run `gh auth login` first.');
    process.exit(1);
  }
}

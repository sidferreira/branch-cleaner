import { emitKeypressEvents } from 'node:readline';

import type { Candidate } from '../types';
import { logger } from '../utils/logger';
import { ANSI, decorateReason } from './ansi';

export function restoreTty(): void {
  process.stdout.write(ANSI.showCursor);
  if (process.stdin.isTTY) {
    try {
      process.stdin.setRawMode(false);
    } catch {
      // already torn down
    }
  }
}

/** Interactive multi-select over the candidate list. Resolves with the picks. */
export async function pickBranches(
  candidates: Candidate[],
): Promise<Candidate[]> {
  if (!process.stdin.isTTY) {
    logger.error('Interactive selection requires a TTY.');
    process.exit(1);
  }

  const selected = new Set<number>();
  let cursor = 0;

  const PAGE_SIZE = 20;
  const totalPages = Math.max(1, Math.ceil(candidates.length / PAGE_SIZE));

  const branchWidth = Math.max(20, ...candidates.map((c) => c.branch.length));
  const reasonWidth = Math.max(...candidates.map((c) => c.reason.length));

  const render = (): void => {
    const page = Math.floor(cursor / PAGE_SIZE);
    const start = page * PAGE_SIZE;
    const end = Math.min(start + PAGE_SIZE, candidates.length);
    const lines: string[] = [];
    lines.push(
      `${ANSI.bold}Local branch cleanup${ANSI.reset} — ${candidates.length} candidate(s) · ${ANSI.dim}page ${page + 1}/${totalPages}${ANSI.reset}`,
    );
    lines.push(
      `${ANSI.dim}↑/↓ move · ←/→ page · space toggle · a toggle-all · enter confirm · q quit${ANSI.reset}`,
    );
    lines.push('');
    for (let i = start; i < end; i += 1) {
      const c = candidates[i]!;
      const mark = selected.has(i) ? '[x]' : '[ ]';
      const reasonPad = ' '.repeat(Math.max(0, reasonWidth - c.reason.length));
      const remote = c.remoteExists ? `${ANSI.yellow}⚑remote${ANSI.reset}` : '';
      const row = `${mark} ${c.branch.padEnd(branchWidth)} ${ANSI.dim}·${
        ANSI.reset
      } ${decorateReason(c)}${reasonPad}  ${remote}`;
      lines.push(i === cursor ? `${ANSI.invert}${row}${ANSI.reset}` : row);
    }
    process.stdout.write(ANSI.clear + lines.join('\n') + '\n');
  };

  return new Promise((resolve) => {
    emitKeypressEvents(process.stdin);
    process.stdin.setRawMode(true);
    process.stdout.write(ANSI.hideCursor);
    render();

    const cleanup = (): void => {
      process.stdin.setRawMode(false);
      process.stdout.write(ANSI.showCursor);
      process.stdin.pause();
      process.stdin.removeListener('keypress', onKey);
    };

    const onKey = (
      _str: string,
      key: { name?: string; ctrl?: boolean },
    ): void => {
      if (key.ctrl === true && key.name === 'c') {
        cleanup();
        restoreTty();
        logger.log('\nCancelled.');
        process.exit(0);
      }
      switch (key.name) {
        case 'up':
          cursor = (cursor - 1 + candidates.length) % candidates.length;
          break;
        case 'down':
          cursor = (cursor + 1) % candidates.length;
          break;
        case 'left': {
          const offset = cursor % PAGE_SIZE;
          const page = Math.floor(cursor / PAGE_SIZE);
          const newPage = (page - 1 + totalPages) % totalPages;
          cursor = Math.min(newPage * PAGE_SIZE + offset, candidates.length - 1);
          break;
        }
        case 'right': {
          const offset = cursor % PAGE_SIZE;
          const page = Math.floor(cursor / PAGE_SIZE);
          const newPage = (page + 1) % totalPages;
          cursor = Math.min(newPage * PAGE_SIZE + offset, candidates.length - 1);
          break;
        }
        case 'space':
          if (selected.has(cursor)) selected.delete(cursor);
          else selected.add(cursor);
          break;
        case 'a':
          if (selected.size === candidates.length) selected.clear();
          else candidates.forEach((_, i) => selected.add(i));
          break;
        case 'return':
          cleanup();
          resolve(
            [...selected].sort((a, b) => a - b).map((i) => candidates[i]!),
          );
          return;
        case 'q':
        case 'escape':
          cleanup();
          resolve([]);
          return;
        default:
          return;
      }
      render();
    };

    process.stdin.on('keypress', onKey);
  });
}

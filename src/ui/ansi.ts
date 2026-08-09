import type { Candidate } from '../types';

export const ANSI = {
  clear: '\x1b[2J\x1b[H',
  hideCursor: '\x1b[?25l',
  showCursor: '\x1b[?25h',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  invert: '\x1b[7m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
} as const;

/** Wrap text in an OSC 8 terminal hyperlink escape sequence. */
export function hyperlink(text: string, url: string): string {
  return `\x1b]8;;${url}\x1b\\${text}\x1b]8;;\x1b\\`;
}

/** Turn the `#NN` in a candidate's reason into a cyan clickable PR link. */
export function decorateReason(c: Candidate): string {
  if (c.prNumber === null || c.prUrl === null) return c.reason;
  const link = hyperlink(`#${c.prNumber}`, c.prUrl);
  return c.reason.replace(`#${c.prNumber}`, `${ANSI.cyan}${link}${ANSI.reset}`);
}

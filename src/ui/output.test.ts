import { describe, expect, it } from 'vitest';

import { formatMultiline } from './output';

describe('formatMultiline', () => {
  it('keeps a single item on one line', () => {
    expect(formatMultiline('git branch -D', ['feature/x'])).toBe(
      '  git branch -D feature/x',
    );
  });

  it('backslash-continues and aligns multiple items', () => {
    const out = formatMultiline('git branch -D', ['a', 'b', 'c']);
    const indent = ' '.repeat('git branch -D'.length + 3);
    expect(out).toBe(
      ['  git branch -D a \\', `${indent}b \\`, `${indent}c`].join('\n'),
    );
  });

  it('does not add a trailing backslash to the last item', () => {
    const out = formatMultiline('git push origin --delete', ['a', 'b']);
    expect(out.endsWith('b')).toBe(true);
  });
});

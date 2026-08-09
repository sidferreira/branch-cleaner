import { describe, expect, it } from 'vitest';

import { eqi, lc } from './text';

describe('eqi', () => {
  it('matches regardless of case', () => {
    expect(eqi('Main', 'main')).toBe(true);
    expect(eqi('FEATURE/X', 'feature/x')).toBe(true);
  });

  it('rejects different strings', () => {
    expect(eqi('main', 'master')).toBe(false);
  });
});

describe('lc', () => {
  it('lowercases', () => {
    expect(lc('Feature/ABC')).toBe('feature/abc');
  });
});

import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  target: 'node18',
  clean: true,
  // Bundle chalk into the output so the published package has zero runtime deps.
  noExternal: ['chalk'],
  // Make the emitted entry directly executable via npx / a bin symlink.
  banner: { js: '#!/usr/bin/env node' },
});

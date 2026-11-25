#!/usr/bin/env node
import { readFile } from '@dephub/read';

import { useCli } from '#/core/cli.ts';

await useCli({
  defaultConfigPath: 'layer.config.ts',
  defaultOutDir: '.layer',
  description: __PKG_DESCRIPTION__,
  name: __PKG_NAME__.split('/')[1],
  outExtension: '.json',
  parser: async (entry) => {
    const raw = await readFile(entry);

    return JSON.parse(raw);
  },
  pattern: '**/*.json',
  version: __PKG_VERSION__,
});

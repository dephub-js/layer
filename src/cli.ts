#!/usr/bin/env node
import { readFile } from '@dephub/read';

import { useCli } from '#/core/cli.ts';
import { description, name, version } from '#/utils/pkg.ts';

await useCli({
  defaultConfigPath: 'layer.config.ts',
  defaultOutDir: '.layer',
  description,
  name: name.split('/')[1] ?? 'layer',
  outExtension: '.json',
  parser: async (entry) => {
    const raw = await readFile(entry);

    return JSON.parse(raw);
  },
  pattern: '**/*.json',
  version,
});

// node src/cli.ts b

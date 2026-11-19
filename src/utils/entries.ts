import { path } from '@dephub/path';
import { glob } from 'fs/promises';

import type { ConfigSchema } from './config.ts';
import type { Entries, ImportsMap } from './types.ts';

import { formatExtension, formatPattern } from './format.ts';

type ResolveEntries = Pick<
  ConfigSchema,
  'contentDir' | 'exclude' | 'outDir' | 'outExtension' | 'pattern'
>;

export async function resolveEntries({
  contentDir,
  exclude,
  outDir,
  outExtension,
  pattern,
}: ResolveEntries): Promise<{
  entries: Entries;
  importsMap: ImportsMap;
}> {
  const importsMap: ImportsMap = Object.create(null);
  const seen = new Map<string, string>();
  const absoluteContentPath: string = path.resolve(contentDir);
  const entries: Entries = [];

  for await (const entry of glob(formatPattern(contentDir, pattern))) {
    const relativeFilePath = path.relative(absoluteContentPath, entry);
    if (exclude.some((term) => relativeFilePath.includes(term))) continue;

    const internalDir = path.dirname(relativeFilePath);

    const outFilePath = path.join(
      outDir,
      formatExtension(relativeFilePath, outExtension),
    );

    if (seen.has(outFilePath)) {
      throw new Error(
        `Duplicate output "${outFilePath}" — "${entry}" collides with "${seen.get(outFilePath)}". ` +
          `Rename one or exclude one via the "exclude" option.`,
      );
    }
    seen.set(outFilePath, entry);

    entries.push({ entry, internalDir, outFilePath });
    // Safe: keys come from `path.dirname`/`path.parse`, not user input.
    /* eslint-disable security/detect-object-injection */
    importsMap[internalDir] ??= Object.create(null);
    importsMap[internalDir][path.parse(relativeFilePath).name] = outFilePath;
  }

  return { entries, importsMap };
}

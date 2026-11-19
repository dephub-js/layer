/* eslint-disable security/detect-object-injection */
/* eslint-disable security/detect-non-literal-fs-filename */
/* eslint-disable no-await-in-loop */
import { path } from '@dephub/path';
import { writeFile } from '@dephub/write';
import { mkdir } from 'node:fs/promises';

import type { ConfigSchema } from './config.ts';
import type { Entries } from './types.ts';

import { canAccess } from './access.ts';
import { useCache } from './cache.ts';
import { hasErrorMessage } from './has.ts';
import { logError, logUpdate } from './log.ts';
import { getMtime } from './mtime.ts';

interface BuildLayer extends Pick<
  ConfigSchema,
  | 'configPath'
  | 'contentDir'
  | 'docType'
  | 'exclude'
  | 'name'
  | 'outDir'
  | 'parser'
  | 'schemas'
  | 'transformers'
> {
  entries: Entries;
  verbose: boolean;
}

export async function buildLayer({
  configPath,
  contentDir,
  docType,
  entries,
  exclude,
  name,
  outDir,
  parser,
  schemas,
  transformers,
  verbose,
}: BuildLayer): Promise<{
  changed: boolean;
  ok: boolean;
}> {
  let changed = false;

  try {
    const cache = await useCache(outDir);
    const cachedConfig = await cache.get('config');

    const configHash = await (async () => {
      if (configPath) {
        return String(await getMtime(configPath));
      }
      return `${contentDir}$${outDir}$${docType}$${JSON.stringify(exclude)}$${JSON.stringify(schemas)}$${JSON.stringify(transformers)}`;
    })();

    for (const { entry, internalDir, outFilePath } of entries) {
      const mtimeNum = Number(await getMtime(entry));
      const cachedMtime = await cache.get(entry);

      if (cachedMtime !== mtimeNum || cachedConfig !== configHash) {
        changed = true;
        const fileStart = performance.now();
        let data = await parser(entry);

        if (schemas[internalDir]) {
          try {
            data = await schemas[internalDir].parseAsync(data);
          } catch (error) {
            if (hasErrorMessage(error)) {
              logError(name, error.message);
              return { changed, ok: false };
            }

            throw error;
          }
        }

        if (transformers[internalDir]) {
          data = await transformers[internalDir](data);
        }

        if (!(await canAccess(path.join(outDir, internalDir)))) {
          await mkdir(path.join(outDir, internalDir), { recursive: true });
        }

        await writeFile(outFilePath, JSON.stringify(data, null, 2));

        if (verbose) {
          logUpdate('builder', {
            duration: performance.now() - fileStart,
            filePath: outFilePath,
            name,
          });
        }

        await cache.set(entry, mtimeNum);
      }
    }

    if (changed) {
      await cache.set('config', configHash);
    }
  } catch (error) {
    if (hasErrorMessage(error)) {
      logError(name, error.message);
      return { changed, ok: false };
    }

    throw error;
  }

  return { changed, ok: true };
}

/* eslint-disable security/detect-object-injection */
/* eslint-disable security/detect-non-literal-fs-filename */
/* eslint-disable no-await-in-loop */
import { path } from '@dephub/path';
import { writeFile } from '@dephub/write';
import { mkdir } from 'node:fs/promises';

import type { BuilderContext } from '#/core/types.ts';

import type { ConfigSchema } from './config.ts';

import { canAccess } from './access.ts';
import { useCache } from './cache.ts';
import { resolveEntries } from './entries.ts';
import { hasErrorMessage, hasUnknownGroup } from './has.ts';
import { logError, logMessage, logUpdate } from './log.ts';
import { getMtime } from './mtime.ts';

export async function buildLayer(
  mode: BuilderContext['mode'],
  {
    configPath,
    contentDir,
    defaultOutDir,
    docType,
    exclude,
    name,
    outDir,
    outExtension,
    parser,
    pattern,
    resolver,
    schemas,
    tasks,
    transformers,
    version,
  }: ConfigSchema,
): Promise<{
  changed: boolean;
  ok: boolean;
}> {
  let changed = false;

  try {
    const { entries, importsMap } = await resolveEntries({
      contentDir,
      exclude,
      outDir,
      outExtension,
      pattern,
    });

    if (hasUnknownGroup({ importsMap, name, schemas })) {
      return { changed, ok: false };
    }

    if (hasUnknownGroup({ importsMap, name, transformers })) {
      return { changed, ok: false };
    }

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
        const start = performance.now();
        let data = await parser(entry);

        if (schemas[internalDir]) {
          try {
            data = await schemas[internalDir].parseAsync(data);
          } catch (error) {
            if (hasErrorMessage(error)) {
              logError(
                name,
                `Schema validation failed in ${entry}: ${error.message}`,
              );
              return { changed, ok: false };
            }
            throw error;
          }
        }

        if (transformers[internalDir]) {
          data = await transformers[internalDir](data);
        }

        if (resolver) {
          data = await resolver({
            contentDir,
            defaultOutDir,
            docType,
            exclude,
            log: (message) => logMessage(name, message),
            mode,
            name,
            outDir,
            outExtension,
            parser,
            pattern,
            schemas,
            transformers,
            version,
          } satisfies Omit<BuilderContext, 'changed' | 'importsMap'>);
        }

        if (!(await canAccess(path.join(outDir, internalDir)))) {
          await mkdir(path.join(outDir, internalDir), { recursive: true });
        }

        await writeFile(outFilePath, JSON.stringify(data, null, 2));

        logUpdate(mode, {
          duration: performance.now() - start,
          filePath: outFilePath,
          name,
        });

        await cache.set(entry, mtimeNum);
      }
    }

    if (changed) {
      await cache.set('config', configHash);
    }

    for await (const task of tasks) {
      await task({
        changed,
        contentDir,
        defaultOutDir,
        docType,
        exclude,
        importsMap,
        log: (message) => logMessage(name, message),
        mode,
        name,
        outDir,
        outExtension,
        parser,
        pattern,
        schemas,
        transformers,
        version,
      } satisfies BuilderContext);
    }
  } catch (error) {
    if (error instanceof Error) {
      logError(name, error.message);
      return { changed, ok: false };
    }

    throw error;
  }

  return { changed, ok: true };
}

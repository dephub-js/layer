/* eslint-disable security/detect-non-literal-fs-filename */

import { path } from '@dephub/path';
import { glob, watch } from 'node:fs/promises';

import { hasContentDir } from '#/utils/access.ts';
import { buildLayer } from '#/utils/build.ts';
import { parseConfig } from '#/utils/config.ts';
import { formatPattern } from '#/utils/format.ts';
import { logError, logHeader, setSilent } from '#/utils/log.ts';

import type { LayerConfig, Watcher, WatcherConfig } from './types.ts';

/**
 * Creates and returns a file watcher function that monitors the source content directory
 * for changes and automatically triggers incremental builds with a debounced execution loop.
 *
 * @param watcherConfig Watcher configuration.
 * @returns A promise resolving to an async watcher function that accepts an optional Layer configuration.
 * @throws If a non-`Error` value is thrown during a rebuild.
 *
 * @example
 * ```ts
 * import { path } from '@dephub/path';
 * import { readFile } from '@dephub/read';
 * import { s } from '@dephub/schema';
 * import { writeFile } from '@dephub/write';
 * import { useWatcher } from '@dephub/layer';
 *
 * const watcher = await useWatcher({
 *   defaultOutDir: '.dist',
 *   name: 'my-docs',
 *   outExtension: '.json',
 *   parser: async (entry) => {
 *     const raw = await readFile(entry);
 *
 *     return JSON.parse(raw);
 *   },
 *   pattern: '**\/*.json',
 *   tasks: [
 *     async (ctx) => {
 *       const manifestPath = path.join(ctx.outDir, 'manifest.json');
 *       await writeFile(manifestPath, JSON.stringify(ctx.importsMap, null, 2));
 *       console.log(`> Manifest successfully generated at: ${manifestPath}`);
 *     },
 *   ],
 *   version: '1.0.0',
 * });
 *
 * await watcher({
 *   contentDir: './content/services',
 *   docType: 'Service',
 *   exclude: ['temp'],
 *   outDir: './dist/services',
 *   schemas: {
 *     'tech-support': s.object({
 *       name: s.string(),
 *       pages: s.number(),
 *     }),
 *     'web-development': s.object({
 *       title: s.string(),
 *     }),
 *   },
 *   transformers: {
 *     'tech-support': (data) =>
 *       // `data` is fully typed as `{ name: string, pages: number }`
 *       ({ ...data, processed: true }),
 *     'web-development': (data) =>
 *       // `data` is fully typed as `{ title: string }`
 *       ({ ...data, processed: true }),
 *   },
 * });
 * ```
 */
export async function useWatcher<TParser = unknown>(
  watcherConfig: WatcherConfig<TParser>,
): Promise<Watcher<TParser>> {
  return async function watcher<
    TSchemas extends Record<string, any> = Record<never, any>,
  >(layerConfig: Partial<LayerConfig<TSchemas, TParser>> = {}): Promise<void> {
    const parsedConfig = await parseConfig(
      watcherConfig.name,
      watcherConfig,
      layerConfig,
    );

    if (!parsedConfig.ok) return;
    setSilent(parsedConfig.silent);

    const { contentDir, name, outDir, version } = parsedConfig;
    if (!(await hasContentDir(name, contentDir))) return;

    logHeader('watch', {
      contentDir,
      name,
      outDir,
      version,
    });

    try {
      const result = await buildLayer('build', parsedConfig);
      if (!result.ok) return;

      let timer: NodeJS.Timeout | undefined;
      const contentWatcher = watch(contentDir);

      const files = await Array.fromAsync(
        glob(formatPattern(contentDir, watcherConfig.pattern)),
      );

      for await (const event of contentWatcher) {
        const { filename } = event;

        if (filename && files.includes(path.join(contentDir, filename))) {
          if (timer) clearTimeout(timer);

          timer = setTimeout(async () => {
            const result_ = await buildLayer('watch', parsedConfig);
            if (!result_.ok) return;

            timer = undefined;
          }, 100);
        }
      }
    } catch (error) {
      if (error instanceof Error) {
        logError(name, error.message);
        return;
      }
      throw error;
    }
  };
}

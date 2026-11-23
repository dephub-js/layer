import { hasContentDir } from '#/utils/access.ts';
import { buildLayer } from '#/utils/build.ts';
import { parseConfig } from '#/utils/config.ts';
import {
  logBuildSummary,
  logError,
  logHeader,
  setSilent,
} from '#/utils/log.ts';

import type { Builder, BuilderConfig, LayerConfig } from './types.ts';

/**
 * Creates a configured builder function to process source content files, validate schemas,
 * manage incremental caching, and execute post-build tasks.
 *
 * @param builderConfig Builder configuration.
 * @returns A promise resolving to an async builder function that accepts an optional Layer configuration.
 * @throws If a non-`Error` value is thrown by the parser, a schema, a transformer, or a task.
 *
 * @example
 * ```ts
 * import { path } from '@dephub/path';
 * import { readFile } from '@dephub/read';
 * import { s } from '@dephub/schema';
 * import { writeFile } from '@dephub/write';
 * import { useBuilder } from '@dephub/layer';
 *
 * const builder = await useBuilder({
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
 * await builder({
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
export async function useBuilder<TParser = unknown>(
  builderConfig: BuilderConfig<TParser>,
): Promise<Builder<TParser>> {
  return async function builder<
    TSchemas extends Record<string, any> = Record<never, any>,
  >(layerConfig: Partial<LayerConfig<TSchemas, TParser>> = {}): Promise<void> {
    const startTime = performance.now();

    const parsedConfig = await parseConfig(
      builderConfig.name,
      builderConfig,
      layerConfig,
    );

    if (!parsedConfig.ok) return;
    setSilent(parsedConfig.silent);

    const { contentDir, name, outDir, version } = parsedConfig;
    if (!(await hasContentDir(name, contentDir))) return;

    logHeader('build', {
      contentDir,
      name,
      outDir,
      version,
    });

    try {
      const result = await buildLayer('build', parsedConfig);
      if (!result.ok) return;

      logBuildSummary(name, performance.now() - startTime, result.changed);
    } catch (error) {
      if (error instanceof Error) {
        logError(name, error.message);
        return;
      }
      throw error;
    }
  };
}

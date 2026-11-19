import { hasContentDir } from '#/utils/access.ts';
import { buildLayer } from '#/utils/build.ts';
import { parseConfig } from '#/utils/config.ts';
import { resolveEntries } from '#/utils/entries.ts';
import { hasUnknownGroup } from '#/utils/has.ts';
import {
  logBuildSummary,
  logError,
  logHeader,
  setSilent,
} from '#/utils/log.ts';

import type {
  Builder,
  BuilderConfig,
  BuilderContext,
  LayerConfig,
} from './types.ts';

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
 *     books: s.object({
 *       name: s.string(),
 *       pages: s.number(),
 *     }),
 *     services: s.object({
 *       title: s.string(),
 *     }),
 *   },
 *   transformers: {
 *     books: (data) =>
 *       // `data` is fully typed as `{ name: string, pages: number }`
 *       data,
 *     services: (data) =>
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
  >(
    this: boolean | undefined,
    layerConfig: Partial<LayerConfig<TSchemas, TParser>> = {},
  ): Promise<void> {
    const startTime = performance.now();

    const parsedConfig = await parseConfig(
      builderConfig.name,
      builderConfig,
      layerConfig,
    );

    if (!parsedConfig.ok) return;
    const verbose = !(this ?? parsedConfig.silent);
    setSilent(parsedConfig.silent);

    const {
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
      schemas,
      tasks,
      transformers,
      version,
    } = parsedConfig;

    if (!(await hasContentDir(name, contentDir))) {
      return;
    }

    if (verbose) {
      logHeader('builder', {
        contentDir,
        name,
        outDir,
        version,
      });
    }

    try {
      const { entries, importsMap } = await resolveEntries({
        contentDir,
        exclude,
        outDir,
        outExtension,
        pattern,
      });

      if (hasUnknownGroup({ importsMap, name, schemas })) return;
      if (hasUnknownGroup({ importsMap, name, transformers })) return;

      const result = await buildLayer({
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
      });

      if (!result.ok) return;

      for await (const task of tasks) {
        await task({
          changed: result.changed,
          contentDir,
          defaultOutDir,
          docType,
          exclude,
          importsMap,
          name,
          outDir,
          outExtension,
          parser,
          pattern,
          schemas,
          transformers,
          version,
        } satisfies BuilderContext<TParser>);
      }

      if (verbose) {
        logBuildSummary(name, performance.now() - startTime, result.changed);
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

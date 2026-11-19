import { Command, CommandError } from '@dephub/command';

import { useBuilder } from '#/core/builder.ts';
import { useWatcher } from '#/core/watcher.ts';
import { loadConfig } from '#/utils/config.ts';
import { logError } from '#/utils/log.ts';

import type { BuilderConfig, CliConfig, LayerConfig } from './types.ts';

/**
 * Initializes and executes the command-line interface for the application.
 * Sets up commands, options, configuration loading, and handles execution
 * loops for both single builds and file watching.
 *
 * @param cliConfig CLI + builder configuration.
 * @returns A promise that resolves when the CLI command finishes executing.
 * @throws If an unexpected (non-`CommandError`) error occurs.
 *
 * @example
 * ```ts
 * import { readFile } from '@dephub/read';
 * import { useCli } from '@dephub/layer';
 *
 * await useCli({
 *   name: 'my-docs',
 *   version: '1.0.0',
 *   description: 'Build and watch documentation content',
 *   defaultConfigPath: 'layer.config.ts',
 *   defaultOutDir: '.dist',
 *   pattern: '**\/*.json',
 *   outExtension: '.json',
 *   parser: async (entry) => {
 *     const raw = await readFile(entry);
 *
 *    return JSON.parse(raw);
 *  },
 * });
 * ```
 */
export async function useCli<TParser = unknown>(
  cliConfig: CliConfig<TParser>,
): Promise<void> {
  const { defaultConfigPath, description, ...builderConfig } = cliConfig;
  const cmd = new Command()
    .name(builderConfig.name)
    .version(builderConfig.version)
    .description(description);

  cmd
    .command('build', 'Build the project from source content')
    .alias('b')
    .argument('contentDir', {
      description:
        'The directory containing source content (default: ./content)',
      optional: true,
    })
    .option('docType', {
      description:
        'Specific document type to filter and process (default: Content)',
      optional: true,
      shortFlag: 'd',
    })
    .option('outDir', {
      description: 'The directory where output will be saved (default: .layer)',
      optional: true,
      shortFlag: 'o',
    })
    .option('exclude', {
      description:
        'Patterns or paths to exclude from processing (e.g. "drafts", "temp/")',
      kind: 'variadic',
      optional: true,
      shortFlag: 'e',
    })

    .option('config', {
      description: `Path to a custom config file (default: ${defaultConfigPath})`,
      optional: true,
      shortFlag: 'c',
    })
    .option('silent', {
      description: 'Suppress progress logs (errors are always shown)',
      kind: 'flag',
      shortFlag: 's',
    })
    .option('watch', {
      description: 'Watch for file changes and rebuild automatically',
      kind: 'flag',
      shortFlag: 'w',
    })
    .handler(async ({ args, options }) => {
      const {
        config: customConfigPath,
        silent,
        watch,
        ...cliOptions
      } = options;

      const configFile = await loadConfig(
        builderConfig.name,
        defaultConfigPath,
        customConfigPath,
      );

      const layerConfig = {
        ...configFile,
        ...cliOptions,
        ...args,
      } satisfies Partial<LayerConfig>;

      const resolvedBuilderConfig = {
        ...builderConfig,
        silent: silent ?? builderConfig.silent,
      } satisfies BuilderConfig;

      if (watch) {
        const watcher = await useWatcher(resolvedBuilderConfig);
        await watcher(layerConfig);
      } else {
        const builder = await useBuilder(resolvedBuilderConfig);

        await builder(layerConfig);
      }
    });

  try {
    await cmd.run();
  } catch (error) {
    if (error instanceof CommandError) {
      logError(builderConfig.name, error.message);
      cmd.help();
      process.exit(1);
    }
    throw error;
  }
}

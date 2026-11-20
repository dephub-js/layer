import type { ImportsMap, Transformers } from '#/utils/types.ts';

/**
 * A builder function returned by `useBuilder`.
 *
 * @example
 * ```ts
 * const builder: Builder<{ name: string }> = await useBuilder({ ... });
 * ```
 */
export type Builder<TParser = unknown> = <
  TSchemas extends Record<string, any> = Record<never, any>,
>(
  layerConfig?: Partial<LayerConfig<TSchemas, TParser>>,
) => Promise<void>;

/**
 * Configuration options required to initialize the builder core.
 */
export interface BuilderConfig<TParser = unknown> {
  /**
   * The default directory where output files will be saved.
   */
  defaultOutDir: string;

  /**
   * The name of the tool or package (used for logging context).
   */
  name: string;

  /**
   * The file extension for generated output files.
   */
  outExtension: `.${string}`;

  /**
   * Parser function to process source entries into buildable data.
   */
  parser: (entry: string) => Promise<TParser> | TParser;

  /**
   * Glob pattern used to match content files.
   */
  pattern: string;

  /**
   * Suppress progress logs (errors are always shown)
   * @default false
   */
  silent?: boolean;

  /**
   * Optional array of asynchronous post-build tasks to execute.
   *
   * @default []
   */
  tasks?: Array<(ctx: BuilderContext<TParser>) => Promise<void> | void>;

  /**
   * The current version of the builder or package.
   */
  version: string;
}

/**
 * Context object passed into asynchronous post-build tasks containing merged configuration,
 * maps, and environment parameters.
 */
export interface BuilderContext<TParser = unknown>
  extends
    LayerConfig<
      {
        [x: string]: {
          parse(data: unknown): unknown;
          parseAsync(data: unknown): Promise<unknown>;
        };
      },
      TParser
    >,
    Pick<
      BuilderConfig,
      | 'defaultOutDir'
      | 'name'
      | 'outExtension'
      | 'parser'
      | 'pattern'
      | 'version'
    > {
  /**
   * Whether the current build produced any file changes.
   */
  changed: boolean;

  /**
   * A nested record mapping internal directories and file names to their relative output file paths.
   */
  importsMap: ImportsMap;

  /**
   * Emits a progress line prefixed with the builder name.
   */
  log: (message: string) => void;
}

/**
 * Configuration options for the CLI interface, extending builder configurations.
 */
export interface CliConfig<TParser = unknown> extends BuilderConfig<TParser> {
  /**
   * The default path to the configuration file.
   */
  defaultConfigPath: string;

  /**
   * A description of the CLI tool or command.
   */
  description: string;
}

/**
 * Configuration options for building a Layer from source content.
 */
export interface LayerConfig<
  TSchemas extends Record<string, any> = Record<never, any>,
  TParser = unknown,
> {
  /**
   * Directory containing the source content files.
   * @default './content'
   */
  contentDir: string;

  /**
   * Specific document type to filter and process.
   * @default 'Content'
   */
  docType: string;

  /**
   * Path substrings used to exclude files from processing.
   * @example ['_drafts', '.temp']
   */
  exclude: Array<string>;

  /**
   * Directory where generated files are written.
   * @default '.layer'
   */
  outDir: string;

  /**
   * Validation schemas indexed by content group.
   * Each schema validates the parsed data for its group.
   */
  schemas: TSchemas;

  /**
   * Transformer functions indexed by content group.
   * Each function transform the parsed data for its group.
   */
  transformers: Transformers<TSchemas, TParser>;
}

/**
 * A watcher function returned by `useWatcher`.
 *
 * @example
 * ```ts
 * const watcher: Watcher<{ name: string }> = await useWatcher({ ... });
 * ```
 */
export type Watcher<TParser = unknown> = Builder<TParser>;

/**
 * Configuration options required to initialize the watcher core.
 */
export type WatcherConfig<TParser> = BuilderConfig<TParser>;

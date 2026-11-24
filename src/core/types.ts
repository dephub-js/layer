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
  /** * The default directory where output files will be saved. */
  defaultOutDir: string;

  /** * The name of the tool or package (used for logging context). */
  name: string;

  /** * The file extension for generated output files. */
  outExtension: `.${string}`;

  /** * Parser function to process source entries into buildable data. */
  parser: (entry: string) => Promise<TParser> | TParser;

  /** * Glob pattern used to match content files.*/
  pattern: string;

  /** Optional resolver to enrich or shape the parsed entry from build context. */
  resolver?: (ctx: ResolverContext<TParser>) => Promise<TParser> | TParser;

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
  tasks?: Array<(ctx: TaskContext<TParser>) => Promise<void> | void>;

  /** * The current version of the builder or package. */
  version: string;
}

/**
 * Base context object containing merged layer and builder configuration,
 * logging helper, and execution mode.
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
      BuilderConfig<TParser>,
      | 'defaultOutDir'
      | 'name'
      | 'outExtension'
      | 'parser'
      | 'pattern'
      | 'version'
    > {
  /**
   * Emits a progress line prefixed with the builder name.
   */
  log: (message: string) => void;

  /**
   * Execution mode for the current build run.
   */
  mode: 'build' | 'watch';
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
 * Context object passed into `resolver` for the entry currently being processed.
 */
export interface ResolverContext<
  TParser = unknown,
> extends BuilderContext<TParser> {
  /** * Source file path currently being resolved. */
  entry: string;
}

/**
 * Context object passed into post-build `tasks` with build change status
 * and generated output mappings.
 */
export interface TaskContext<
  TParser = unknown,
> extends BuilderContext<TParser> {
  /** * Whether the current build produced any file changes. */
  changed: boolean;

  /** * A nested record mapping internal directories and file names to their relative output file paths. */
  importsMap: ImportsMap;
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
export type WatcherConfig<TParser = unknown> = BuilderConfig<TParser>;

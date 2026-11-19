import type { LayerConfig } from '#/core/types.ts';

export type Entries = Array<Entry>;

export interface Entry {
  entry: string;
  internalDir: string;
  outFilePath: string;
}

export type ImportsMap = Record<string, Record<string, string>>;

export interface InternalConfig extends LayerConfig {
  configPath: string;
  ok: boolean;
}

export type Transformers<
  TSchemas extends Record<string, any> = Record<never, any>,
  TParser = unknown,
> = [keyof TSchemas] extends [never]
  ? Record<string, (data: TParser) => Promise<unknown> | unknown>
  : {
      [K in keyof TSchemas]?: (
        data: Awaited<ReturnType<TSchemas[K]['parseAsync']>>,
      ) => Promise<unknown> | unknown;
    };

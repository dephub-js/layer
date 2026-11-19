import type { LayerConfig } from './types.ts';

/**
 * Defines a Layer configuration.
 *
 * Provides type inference and a consistent configuration API.
 *
 * @param layerConfig Layer configuration options.
 * @returns The provided Layer configuration.
 *
 * @example
 * ```ts
 * import { defineConfig } from '@dephub/layer/config';
 *
 * export default defineConfig({
 *   contentDir: './content',
 *   outDir: '.layer',
 * });
 * ```
 */
export function defineConfig<
  TSchemas extends Record<string, any> = Record<never, any>,
  TParser = unknown,
>(
  layerConfig: Partial<LayerConfig<TSchemas, TParser>>,
): Partial<LayerConfig<TSchemas, TParser>> {
  return layerConfig;
}

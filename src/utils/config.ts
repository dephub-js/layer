/* eslint-disable security/detect-object-injection */
import { s } from '@dephub/schema';
import { pathToFileURL } from 'node:url';

import type { BuilderConfig, LayerConfig } from '#/core/types.ts';

import { resolveConfigPath } from '#/utils/path.ts';

import type { InternalConfig } from './types.ts';

import { logError } from './log.ts';

export async function loadConfig(
  name: string,
  defaultPath: string,
  customPath?: string,
): Promise<Partial<InternalConfig>> {
  const configPath = await resolveConfigPath(name, defaultPath, customPath);

  if (!configPath) {
    return { ok: true };
  }

  try {
    const fileUrl = pathToFileURL(configPath);
    const modulePath = `${fileUrl.href}?update=${Date.now()}`;
    const mod = await import(modulePath);
    const config = mod.default ?? mod;

    if (isValidConfig(config)) return { ...config, configPath, ok: true };

    logError(
      name,
      `Invalid export in "${configPath}".\n` +
        `    Expected a single configuration object, e.g.:\n` +
        `      export default defineConfig({ ... })`,
    );

    return { ok: false };
  } catch (error) {
    if (error instanceof Error) {
      logError(name, `Failed to load config: ${error.message}`);
    }
    return { ok: false };
  }
}

function isValidConfig(config: unknown): config is Record<string, unknown> {
  if (config === null || config === undefined || Array.isArray(config)) {
    return false;
  }

  if (typeof config === 'object') {
    const keys = Object.keys(config);

    if (keys.length === 0) return false;

    const isModuleNamespace =
      Object.prototype.toString.call(config) === '[object Module]' ||
      Object.getPrototypeOf(config) === null;

    if (isModuleNamespace) {
      if (keys.length > 1) return false;
      const key = keys[0];

      return isValidConfig((config as Record<string, unknown>)[key]);
    }

    return true;
  }

  return false;
}

const configSchema = s
  .object({
    configPath: s.string().optional(),
    contentDir: s.string().nonempty().default('./content'),
    defaultOutDir: s.string().nonempty(),
    docType: s.string().nonempty().default('Content'),
    exclude: s
      .array(s.string().nonempty())
      .default([])
      .transform((data) => data.filter(Boolean)),
    name: s.string().nonempty(),
    ok: s.boolean().default(true),
    outDir: s.string().nonempty().optional(),
    outExtension: s.templateLiteral(['.', s.string().min(1)]),
    parser: s.function(),
    pattern: s.string().nonempty(),
    resolver: s.function().optional(),
    schemas: s.record(s.string(), s.any()).default({}),
    silent: s.boolean().default(false),
    tasks: s.array(s.function()).default([]),
    transformers: s.record(s.string(), s.function()).default({}),
    version: s.string().nonempty(),
  })
  .strict()
  .transform((data) => ({
    ...data,
    outDir: data.outDir ?? data.defaultOutDir,
  }));

export type ConfigSchema = s.infer<typeof configSchema>;

export async function parseConfig<
  TSchemas extends Record<string, any> = Record<never, any>,
  TParser = unknown,
>(
  name: string,
  builderConfig: BuilderConfig<TParser>,
  layerConfig: Partial<LayerConfig<TSchemas, TParser>>,
): Promise<ConfigSchema | { ok: false }> {
  const parsedData = await configSchema.safeParseAsync({
    ...builderConfig,
    ...layerConfig,
  });

  if (parsedData.success) {
    return parsedData.data;
  }

  logError(name, `Config validation failed: ${parsedData.error.message}`);
  return { ok: parsedData.success };
}

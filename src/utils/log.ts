/* eslint-disable no-console */
import { bold, cyan, dim, green, red } from '@dephub/colors';
import { path } from '@dephub/path';

import type {
  BuilderConfig,
  BuilderContext,
  LayerConfig,
} from '#/core/types.ts';

import { formatDuration, formatPrefix } from './format.ts';

interface LogHeader
  extends
    Pick<BuilderConfig, 'name' | 'version'>,
    Pick<LayerConfig, 'contentDir' | 'outDir'> {}

interface LogUpdate extends Pick<BuilderConfig, 'name'> {
  duration: number;
  filePath: string;
}

let silent = false;

export function logBuildSummary(
  name: string,
  duration: number,
  changed: boolean,
) {
  if (silent) return;
  if (changed) {
    console.log(
      `\n${formatPrefix(name)} ${dim(`Build completed ${formatDuration(duration)}`)}`,
    );
  } else {
    console.log(`${formatPrefix(name)}  ${dim(`All files are up to date.`)}`);
  }
}

export function logConfigPathNotFound(name: string, configPath: string) {
  console.error(
    `${formatPrefix(name)} ${red('Error:')} File not found: ${cyan(configPath)}`,
  );
  console.error(
    `  ${dim('Check your --config argument or ensure the file exists.')}\n`,
  );
}

export function logDirNotFound(name: string, contentDir: string) {
  console.error(
    `${formatPrefix(name)} ${red('Error:')} Directory not found or not accessible ${dim(`[${contentDir}]`)}`,
  );
  console.error(
    `  ${dim('Check your --contentDir argument or create the folder.')}\n`,
  );
}

export function logError(name: string, message: string) {
  console.error(`${formatPrefix(name)} ${red('Error:')} ${message}`);
}

export function logHeader(
  mode: BuilderContext['mode'],
  { contentDir, name, outDir, version }: LogHeader,
) {
  if (silent) return;
  console.log(`\n  ${cyan(bold(name.toUpperCase()))} ${dim(`v${version}`)}`);
  console.log(
    `\n  ${green('➜')}  ${bold(mode === 'build' ? 'Building' : 'Watching')}: ${dim(path.resolve(contentDir))}`,
  );
  console.log(
    `  ${green('➜')}  ${bold('Output')}:   ${dim(path.resolve(outDir))}\n`,
  );
}

export function logMessage(name: string, message: string) {
  if (silent) return;
  console.log(`${formatPrefix(name)} ${message}`);
}

export function logUpdate(
  mode: BuilderContext['mode'],
  { duration, filePath, name }: LogUpdate,
) {
  if (silent) return;
  const action = mode === 'build' ? 'built' : 'rebuilt';

  console.log(
    `${formatPrefix(name)} ${green(action)} ${dim(
      filePath,
    )} ${formatDuration(duration)}`,
  );
}

export function setSilent(value: boolean): void {
  silent = value;
}

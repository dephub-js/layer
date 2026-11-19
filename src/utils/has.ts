/* eslint-disable no-console */
import { green } from '@dephub/colors';

import type { ConfigSchema } from './config.ts';

import { formatQuotes } from './format.ts';
import { logError } from './log.ts';

interface UnknownGroup extends Partial<
  Pick<ConfigSchema, 'schemas' | 'transformers'>
> {
  importsMap: Record<string, Record<string, string>>;
  name: string;
}

export function hasErrorMessage(error: unknown): error is { message: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof error.message === 'string'
  );
}

export function hasUnknownGroup({
  importsMap,
  name,
  schemas,
  transformers,
}: UnknownGroup) {
  const source = schemas ?? transformers;
  const variant = schemas ? 'schema' : 'transform';

  if (!source) return false;

  const available = new Set(Object.keys(importsMap));

  const invalid = Object.keys(source).filter((key) => !available.has(key));

  if (invalid.length) {
    logError(name, `Unknown ${variant} group(s): ${formatQuotes(invalid)}`);
    console.log(
      `\n  ${'Allowed keys:'} ${green(formatQuotes([...available]))}\n`,
    );
    return true;
  }

  return false;
}

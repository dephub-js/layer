import { bold, cyan, dim } from '@dephub/colors';
import { path } from '@dephub/path';

export function formatDuration(duration: number) {
  return dim(`in ${duration.toFixed(0)}ms`);
}

export function formatExtension(file: string, extension: string): string {
  const { dir, name } = path.parse(file);
  const e = extension.startsWith('.') ? extension : `.${extension}`;

  return path.join(dir, `${name}${e}`);
}

export function formatPattern(contentDir: string, pattern: string): string {
  if (pattern === '') return '';

  return `${contentDir}${pattern.startsWith('/') ? pattern : `/${pattern}`}`;
}

export function formatPrefix(name: string): string {
  const time = new Date().toLocaleTimeString([], { hour12: false });

  return `${dim(time)} ${cyan(bold(cyan(bold(name.toUpperCase()))))}`;
}

export function formatQuotes(items: Array<string>): string {
  return items.map((item) => `"${item}"`).join(' | ');
}

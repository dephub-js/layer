import type { PathLike } from 'node:fs';

import { access, constants } from 'node:fs/promises';

import { logDirNotFound } from './log.ts';

export async function canAccess(filePath: PathLike) {
  try {
    await access(filePath, constants.R_OK | constants.W_OK);
    return true;
  } catch {
    return false;
  }
}

export async function hasContentDir(name: string, contentDir: string) {
  if (await canAccess(contentDir)) return true;

  logDirNotFound(name, contentDir);
  return false;
}

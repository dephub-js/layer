import { useCwd } from '@dephub/path';

import { logConfigPathNotFound } from '#/utils/log.ts';

import { canAccess } from './access.ts';

export async function resolveConfigPath(
  name: string,
  defaultPath: string,
  customPath?: string,
): Promise<string | undefined> {
  let resolvedPath: string | undefined;

  if (customPath) {
    const absoluteCustomPath = useCwd(customPath);
    if (await canAccess(absoluteCustomPath)) {
      resolvedPath = absoluteCustomPath;
    } else {
      logConfigPathNotFound(name, absoluteCustomPath);
    }
  } else {
    const defaultPath_ = useCwd(defaultPath);
    if (await canAccess(defaultPath_)) {
      resolvedPath = defaultPath_;
    }
  }

  return resolvedPath;
}

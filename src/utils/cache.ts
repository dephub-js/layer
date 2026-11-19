/* eslint-disable security/detect-non-literal-fs-filename */
import { Disk } from '@dephub/cache';
import { mkdir } from 'node:fs/promises';

import { canAccess } from './access.ts';

export async function useCache(outDir: string): Promise<Disk> {
  if (!(await canAccess(`${outDir}/cache/`))) {
    await mkdir(`${outDir}/cache/`, { recursive: true });
  }

  return new Disk(`${outDir}/cache/timestamp.json`);
}

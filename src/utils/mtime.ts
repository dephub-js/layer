/* eslint-disable security/detect-non-literal-fs-filename */
import { stat } from 'node:fs/promises';

export async function getMtime(filePath: string) {
  const info = await stat(filePath);

  return info.mtime?.getTime();
}

import { dialog } from 'electron';
import { readFile, stat, writeFile } from 'fs/promises';

import { getMainWindow } from './main-window.mjs';

export async function readBufferFromFile(options = {}) {
  const { dialogOptions, maxSize = 1048576 } = options;
  const { filePaths } = await dialog.showOpenDialog(getMainWindow(), {
    ...dialogOptions,
    multiSelections: false,
  });

  if (filePaths && filePaths.length === 1) {
    const fileStat = await stat(filePaths[0]);
    if (fileStat.size > maxSize) {
      throw new Error(
        `File too large; maximum allowed size is ${maxSize} bytes`
      );
    }

    return readFile(filePaths[0]);
  }
}

export async function writeBufferToFile({
  buffer,
  preferredFilename,
  dialogOptions,
}) {
  const { canceled, filePath } = await dialog.showSaveDialog(getMainWindow(), {
    defaultPath: preferredFilename,
    ...dialogOptions,
  });
  if (!canceled) {
    await writeFile(filePath, Buffer.from(new Uint8Array(buffer)));
  }
}

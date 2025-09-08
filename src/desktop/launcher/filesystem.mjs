import { dialog, shell } from 'electron';
import { readFile, stat, unlink, writeFile } from 'fs/promises';
import { temporaryWrite } from 'tempy';

import { getMainWindow } from './main-window.mjs';

// Object listing temporary files that were created by the main process.
// This is used to prevent the renderer process from asking the main process to
// remove arbitrary files; only those that were created by the main process can
// be removed.
const temporaryFiles = [];

export async function openPath(filename) {
  const error = await shell.openPath(filename);
  if (error && error.length > 0) {
    throw new Error(`Failed to open ${filename}: ${error}`);
  }
}

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

export async function removeTemporaryFile(filename) {
  const index = temporaryFiles.indexOf(filename);
  if (index === -1) {
    throw new Error(
      `Cannot remove temporary file ${filename}; it was not created by the main process`
    );
  }

  temporaryFiles.splice(index, 1);
  try {
    await unlink(filename);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
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

export async function writeBufferToTemporaryFile({ buffer, options = {} }) {
  const filename = await temporaryWrite(new Uint8Array(buffer), options);
  temporaryFiles.push(filename);
  return filename;
}

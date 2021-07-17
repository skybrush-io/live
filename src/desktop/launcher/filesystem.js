const { dialog } = require('electron');
const { writeFile } = require('fs/promises');

const { getMainWindow } = require('./main-window');

async function writeBufferToFile({ buffer, preferredFilename, dialogOptions }) {
  const { canceled, filePath } = await dialog.showSaveDialog(getMainWindow(), {
    defaultPath: preferredFilename,
    ...dialogOptions,
  });
  if (!canceled) {
    await writeFile(filePath, Buffer.from(new Uint8Array(buffer)));
  }
}

module.exports = {
  writeBufferToFile,
};

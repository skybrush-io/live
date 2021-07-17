import { saveAs } from 'file-saver';

/**
 * Writes the given text to a file, prompting the user for a place to save the
 * file when running in Electron, or showing a standard "Save file" dialog box
 * when running in the browser.
 *
 * @param {string} text  the text to save
 * @param {string} preferredFilename  the preferred filename when running in the browser
 * @param {object} options  additional options to pass on to the Electron save
 *        file dialog when running in Electron
 * @returns {Promise} a promise that resolves when the file was saved
 */
export function writeTextToFile(text, preferredFilename, options) {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  return writeBlobToFile(blob, preferredFilename, options);
}

/**
 * Writes the given blob to a file, prompting the user for a place to save the
 * file when running in Electron, or showing a standard "Save file" dialog box
 * when running in the browser.
 *
 * @param {blob} blob  the blob to save
 * @param {string} preferredFilename  the preferred filename when running in the browser
 * @param {object} options  additional options to pass on to the Electron save
 *        file dialog when running in Electron
 * @returns {Promise} a promise that resolves when the file was saved
 */
export async function writeBlobToFile(blob, preferredFilename, options = {}) {
  const { writeBufferToFile } = window?.bridge || {};
  if (writeBufferToFile) {
    return writeBufferToFile(
      // we cannot send a blob directly over the context boundary so we send
      // its contents as an array buffer
      await blob.arrayBuffer(),
      preferredFilename,
      options
    );
  } else {
    return saveAs(blob, preferredFilename);
  }
}

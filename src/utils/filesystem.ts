import { saveAs } from 'file-saver';

import { getFileFromUser, readFileAsArrayBuffer } from './files';

type ReadOptions = {
  maxSize?: number;
} & Electron.OpenDialogOptions;

type WriteOptions = Electron.SaveDialogOptions;

/**
 * Allows the user to pick a file, then reads the contents of the file as a blob.
 *
 * Not supported in the browser at the moment.
 *
 * @param {object} options  additional options to pass on to the Electron open
 *        file dialog when running in Electron, except <code>maxSize</code>,
 *        which is treated as an upper limit on the size of the file being
 *        picked (defaults to 1M)
 *        NOTE: When running in the browser, these options are currently ignored
 *
 * @returns {Promise} a promise that resolves to the contents of the file as a
 *          blob
 */
export const readBlobFromFile = async ({
  maxSize,
  ...dialogOptions
}: ReadOptions = {}): Promise<Blob> =>
  new Blob(
    [
      (await window?.bridge?.readBufferFromFile({ maxSize, dialogOptions })) ??
        // TODO: Pass the relevant subset of options, e.g. filters -> accept,
        //       multiSelections -> multiple, openDirectory -> webkitdirectory
        (await readFileAsArrayBuffer(await getFileFromUser()))!,
    ],
    { type: 'application/octet-stream' }
  );

/**
 * Allows the user to pick a file, then reads the contents of the file as text.
 *
 * @returns a promise that resolves to the contents of the file as a string
 */
export async function readTextFromFile(
  options: ReadOptions = {}
): Promise<string> {
  const blob = await readBlobFromFile(options);
  return blob.text();
}

/**
 * Writes the given blob to a file, prompting the user for a place to save the
 * file when running in Electron, or showing a standard "Save file" dialog box
 * when running in the browser.
 *
 * @param  blob  the blob to save
 * @param  preferredFilename  the preferred filename when running in the browser
 * @param  options  additional options to pass on to the Electron save
 *        file dialog when running in Electron
 * @returns a promise that resolves when the file was saved
 */
export async function writeBlobToFile(
  blob: Blob,
  preferredFilename: string,
  options: WriteOptions = {}
): Promise<void> {
  const { writeBufferToFile } = window?.bridge ?? {};
  if (writeBufferToFile) {
    return writeBufferToFile(
      // we cannot send a blob directly over the context boundary so we send
      // its contents as an array buffer
      await blob.arrayBuffer(),
      preferredFilename,
      options
    );
  } else {
    saveAs(blob, preferredFilename);
  }
}

/**
 * Writes the given text to a file, prompting the user for a place to save the
 * file when running in Electron, or showing a standard "Save file" dialog box
 * when running in the browser.
 *
 * @param text  the text to save
 * @param preferredFilename  the preferred filename when running in the browser
 * @param options  additional options to pass on to the Electron save file dialog
 *        when running in Electron
 * @returns a promise that resolves when the file was saved
 */
export async function writeTextToFile(
  text: string,
  preferredFilename: string,
  options: WriteOptions = {}
): Promise<void> {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  return writeBlobToFile(blob, preferredFilename, options);
}

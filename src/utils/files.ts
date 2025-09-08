/**
 * @file Utility functions related to the Web File API.
 */

/**
 * Allows the user to pick one or more files via the browser's selection dialog.
 *
 * @param {object} options - Additional options to be set on the input field
 * @returns {Promise} A promise that resolves to the list of selected files
 */
export const getFilesFromUser = async (
  options: ElementCreationOptions
): Promise<FileList> =>
  new Promise((resolve, reject) => {
    const input: HTMLInputElement = Object.assign(
      document.createElement('input'),
      {
        type: 'file',
        ...options,
      }
    ) as HTMLInputElement;

    input.addEventListener('change', (event) => {
      if (event.target) {
        resolve((event.target as HTMLInputElement).files!);
      }
    });

    input.addEventListener('cancel', () => {
      reject(new Error('File selection canceled'));
    });

    input.click();
  });

/**
 * Tries to get exactly one file from the user, fails otherwise.
 *
 * @param {object} options - Additional options to be set on the input field
 * @returns {Promise} A promise that resolves to the single selected file
 */
export const getFileFromUser = async (
  options: ElementCreationOptions = {}
): Promise<File> => {
  const files = await getFilesFromUser(options);
  if (files.length === 1) {
    return files[0]!;
  } else {
    throw new Error('Exactly one file should be selected');
  }
};

/*
 * The FileReader API can produce the following output types:
 * • ArrayBuffer
 * • BinaryString
 * • DataURL
 * • Text
 */
const makeFileReaderForOutputType =
  (outputType: 'ArrayBuffer' | 'BinaryString' | 'DataURL' | 'Text') =>
  // eslint-disable-next-line @typescript-eslint/ban-types
  async (file: File): Promise<string | ArrayBuffer | null> =>
    new Promise((resolve) => {
      const fileReader = new FileReader();
      fileReader.addEventListener('load', () => {
        resolve(fileReader.result);
      });
      fileReader[`readAs${outputType}`](file);
    });

export const readFileAsArrayBuffer = makeFileReaderForOutputType('ArrayBuffer');
export const readFileAsDataURL = makeFileReaderForOutputType('DataURL');
export const readFileAsText = makeFileReaderForOutputType('Text');

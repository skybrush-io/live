/**
 * @file Utility functions related to the Web File API.
 */

/**
 * Allows the user to pick one or more files via the browser's selection dialog.
 *
 * @param {object} options - Additional options to be set on the input field
 * @returns {Promise} A promise that resolves to the list of selected files
 */
export const getFilesFromUser = async (options) =>
  new Promise((resolve, reject) => {
    const input = Object.assign(document.createElement('input'), {
      type: 'file',
      ...options,
    });

    input.addEventListener('change', (event) => {
      resolve(event.target.files);
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
export const getFileFromUser = async (options) => {
  const files = await getFilesFromUser(options);
  if (files.length === 1) {
    return files[0];
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
const makeFileReaderForOutputType = (outputType) => (file) =>
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

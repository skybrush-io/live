/**
 * @file Utility functions related to the Web File API.
 */

/*
 * The FileReader API can produce the following output types:
 * • ArrayBuffer
 * • BinaryString
 * • DataURL
 * • Text
 */
const makeFileReaderForOutputType = (outputType) => {
  return async (file) =>
    new Promise((resolve) => {
      const fileReader = new FileReader();
      fileReader.addEventListener('load', () => {
        resolve(fileReader.result);
      });
      fileReader[`readAs${outputType}`](file);
    });
};

export const readFileAsArrayBuffer = makeFileReaderForOutputType('ArrayBuffer');
export const readFileAsDataURL = makeFileReaderForOutputType('DataURL');
export const readFileAsText = makeFileReaderForOutputType('Text');

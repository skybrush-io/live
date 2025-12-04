import {
  loadShowSpecificationAndZip,
  type ShowSpecification,
} from '@skybrush/show-format';

type LoadShowOptions = {
  /**
   * Specifies whether a base64-encoded ZIP representation of the show should
   * also be returned.
   */
  returnBlob?: boolean;
};

/**
 * Loads a Skybrush show file and returns its specification along with an
 * optional base64-encoded blob representing the show file itself.
 *
 * @param file  the file to load, which can be a string (file path), an array
 *        of bytes, an array buffer or a Blob object.
 * @param options  options for loading the show
 * @returns  the show specification and optionally a base64-encoded string
 *        representing the show file.
 */
export default async function loadShow(
  file: string | number[] | Uint8Array | ArrayBuffer | Blob,
  options: LoadShowOptions = {}
): Promise<{
  spec: ShowSpecification;
  base64Blob?: string;
}> {
  const { returnBlob = true } = options;
  const { showSpec, zip } = await loadShowSpecificationAndZip(file);
  const base64Blob = returnBlob
    ? await zip.generateAsync({ type: 'base64' })
    : undefined;
  return { spec: showSpec, base64Blob };
}

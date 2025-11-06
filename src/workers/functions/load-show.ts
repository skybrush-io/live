import {
  loadShowSpecificationAndZip,
  type ShowSpecification,
} from '@skybrush/show-format';
import { Transfer } from 'workerpool';

type LoadShowOptions = {
  /**
   * Specifies whether a base64-encoded ZIP representation of the show should
   * also be returned.
   */
  returnBlob?: boolean;
};

type Response = {
  spec: ShowSpecification;
  blob?: Uint8Array;
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
): Promise<Response> {
  const { returnBlob = true } = options;
  const { showSpec, zip } = await loadShowSpecificationAndZip(file);
  const blob = returnBlob
    ? await zip.generateAsync({ type: 'uint8array' })
    : undefined;

  // We need to return a Transfer object to indicate to workerpool that the
  // underlying ArrayBuffer should be transferred instead of copied. However,
  // we still want to provide the right typing for the return value, so we
  // need to cast
  return new Transfer(
    { spec: showSpec, blob },
    blob ? [blob.buffer] : []
  ) as any as Response;
}

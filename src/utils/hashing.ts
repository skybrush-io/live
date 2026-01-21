/**
 * Calculates the SHA-1 hash of the given string.
 *
 * Only use this function for calculating signatures. Do not use it for security purposes.
 */
export async function sha1(data: string): Promise<string> {
  const encoded = new TextEncoder().encode(data);
  const hash = await window.crypto.subtle.digest('SHA-1', encoded);
  const uint8Hash = new Uint8Array(hash);
  // TODO: use uint8Hash.toHex() instead when toHex() is more broadly available.
  return Array.from(uint8Hash, (byte) =>
    byte.toString(16).padStart(2, '0')
  ).join('');
}

import type { FileOptions } from 'tempy';

export type Bridge = {
  createTCPSocket: unknown;
  openPath: (path: string) => Promise<void>;
  readBufferFromFile: (options?: {
    maxSize?: number;
    dialogOptions?: Electron.OpenDialogOptions;
  }) => Promise<Uint8Array>;
  removeTemporaryFile: (path: string) => Promise<void>;
  writeBufferToFile: (
    buffer: ArrayBuffer,
    preferredFilename: string,
    options?: Electron.SaveDialogOptions
  ) => Promise<void>;
  writeBufferToTemporaryFile: (
    buffer: ArrayBuffer,
    options?: FileOptions
  ) => Promise<string>;
};

declare global {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface Window {
    bridge?: Bridge;
  }
}

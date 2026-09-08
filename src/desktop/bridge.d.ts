import type { FileOptions } from 'tempy';

export type Bridge = {
  isElectron: boolean;

  createTCPSocket: unknown;
  localServer?: {
    selectPath: (currentPath: string | null) => Promise<string | null>;
  };
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

  /**
   * Reads the file with the given name from the disk and returns a Blob object
   * that is compatible with Electron's File objects so they can be used
   * interchangeably.
   */
  getFileAsBlob: (
    filename: string,
    mimeType?: string,
    options?: { start?: number; end?: number }
  ) => Promise<{
    buffer: ArrayBuffer;
    props: {
      // We need an absolute path because we are trying to mimic Electron's
      // File object here, which contains the _full_, absolute path in the
      // path attribute
      path: string;
      name: string;
    };
  }>;
};

declare global {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface Window {
    bridge?: Bridge;
  }
}

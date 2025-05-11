export type Bridge = {
  createTCPSocket: unknown;
  readBufferFromFile: (options: {
    maxSize?: number;
    dialogOptions?: Electron.OpenDialogOptions;
  }) => Promise<Uint8Array>;
  writeBufferToFile: (
    buffer: ArrayBuffer,
    preferredFilename: string,
    options: Electron.SaveDialogOptions
  ) => Promise<void>;
};

declare global {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface Window {
    bridge?: Bridge;
  }
}

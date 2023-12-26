export type Bridge = {
  createTCPSocket: unknown;
};

declare global {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface Window {
    bridge?: Bridge;
  }
}

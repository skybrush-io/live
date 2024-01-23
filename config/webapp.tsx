/**
 * @file Application configuration at startup, suitable for deploying Live on
 * the same web server that also serves the Socket.IO channel of the server.
 */

import { type ConfigOverrides } from 'config-overrides';

const overrides: ConfigOverrides = {
  // Defaults are suitable for the web app deployment. Connects back to the
  // same hostname and port by default, and does not allow overriding the
  // hostname and port from the dialog.
  server: {
    connectAutomatically: true,
    preventManualSetup: true,
  },
};

export default overrides;

/**
 * @file Default application configuration at startup.
 */

import {
  isTCPConnectionSupported,
  Protocol,
} from '~/features/servers/server-settings-dialog';

const config = {
  ephemeral: false,
  examples: [],
  features: {
    /* any features not explicitly set to 'false' are considered to be allowed
     * by default */
    loadShowFromCloud: false,
  },
  server: {
    connectAutomatically: true,
    hostName: 'localhost',
    port: isTCPConnectionSupported ? 5001 : 5000,
    protocol: isTCPConnectionSupported ? Protocol.TCP : Protocol.WS,
  },
  session: {},
  tour: null,
  urls: {
    help: 'https://doc.collmot.com/public/skybrush-live-doc/latest/index.html',
  },
};

export default config;

/**
 * @file Default application configuration at startup.
 */

const config = {
  ephemeral: false,
  examples: [],
  features: {
    /* any features not explicitly set to 'false' are considered to be allowed
     * by default */
    loadShowFromCloud: false,
    perspectives: false,
  },
  perspectives: ['default'],
  server: {
    connectAutomatically: true,
    hostName: 'localhost',
    // port and protocol will be inferred during onboarding
  },
  session: {},
  tour: null,
  urls: {
    help: 'https://doc.collmot.com/public/skybrush-live-doc/latest/index.html',
  },
};

export default config;

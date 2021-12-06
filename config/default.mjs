/**
 * @file Default application configuration at startup.
 */

const config = {
  ephemeral: false,
  examples: [],
  features: {
    /* any features not explicitly set to 'false' are considered to be allowed
     * by default */
  },
  server: {
    connectAutomatically: true,
    port: 5000,
  },
  session: {},
  tour: null,
  urls: {
    help: 'https://doc.collmot.com/public/skybrush-live-doc/latest/index.html',
  },
};

export default config;

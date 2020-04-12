/**
 * @file Application configuration at startup, suitable for the web app demo deployment.
 */

export default {
  // We bundle an example show with the webapp demo but not with the "real" one
  examples: [
    {
      id: 'example-40',
      title: 'Example show with 40 drones',
      url: require('~/../assets/shows/demo.skyc').default
    }
  ],

  // Defaults are suitable for the web app demo deployment. Connects back to the
  // same hostname and port by default, and does not allow overriding the
  // hostname and port from the dialog.
  server: {
    connectAutomatically: true,
    preventManualSetup: true
  },

  // Tour setup customized to suit the default screen of the web app
  tour: {
    steps: []
  }
};

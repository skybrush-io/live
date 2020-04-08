/**
 * @file Application configuration at startup, suitable for the web app demo deployment.
 */

export default {
  // Defaults are suitable for the web app demo deployment. Connects back to the
  // same hostname and port by default, and does not allow overriding the
  // hostname and port from the dialog.
  server: {
    connectAutomatically: true,
    preventManualSetup: true
  }
};

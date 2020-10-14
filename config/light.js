/**
 * @file Stripped application configuration that can be given to drone
 * manufacturers for testing without revealing too much about the app itself.
 */

export default {
  // State is ephemeral; we do not load it back from the disk when the app starts
  ephemeral: true,

  // No bundled examples
  examples: [],

  // Hide some of the features
  features: {
    docks: false,
    features: false, // okay, sorry for the naming, this is awkward :)
    geofence: false,
    showControl: false,
    threeDView: false,
    toolboxMenu: false,
  },

  // Ribbon in bottom left corner to indicate that this version is not for distribution
  ribbon: {
    label: 'Do not distribute',
    position: 'bottomLeft',
  },

  // Configure to connect to the MAVLink proxy server. Does not allow overriding
  // the hostname and port from the dialog.
  server: {
    connectAutomatically: true,
    preventAutodetection: true,
    preventManualSetup: true,
    hostName: 'proxy.skybrush.collmot.com',
    port: 443,
    isSecure: true,
  },

  // No startup tour
  tour: null,

  // Help lives here
  // TODO(ntamas): write document, put it online
  urls: {
    help: 'https://doc.collmot.com/public/skybrush-live-doc/latest/index.html',
  },
};

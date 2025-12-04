/**
 * @file Application configuration at startup, suitable for the web app demo deployment.
 */

import * as React from 'react';
import demoShowUrl from '~/../assets/shows/demo.skyc';

import { type ConfigOverrides } from 'config-overrides';

import { type Latitude, type Longitude } from '~/utils/geography';

const overrides: ConfigOverrides = {
  // We bundle an example show with the webapp demo but not with the "real" one
  examples: {
    shows: [
      {
        id: 'example-20',
        title: 'Example show with 20 drones',
        url: demoShowUrl,
      },
    ],
  },

  // Enable the loading of the bundled example show
  features: {
    loadShowFromCloud: true,
  },

  // Set the origin and the view to Farkashegy Airfield to match the guided tour
  map: {
    origin: {
      position: [18.915125 as Longitude, 47.486305 as Latitude],
      angle: '59',
    },

    view: {
      position: [18.915125 as Longitude, 47.486305 as Latitude],
      angle: '0',
      zoom: 17,
    },
  },

  // Defaults are suitable for the web app demo deployment. Connects back to the
  // same hostname and port by default, and does not allow overriding the
  // hostname and port from the dialog.
  server: {
    connectAutomatically: true,
    hostName: '', // empty string to allow the substitution of the hostname and port from the URL
    preventManualSetup: true,
  },

  // Session setup
  session: {
    maxLengthInSeconds: 3600,
  },

  urls: {
    exit: 'https://account.skybrush.io',
  },
};

export default overrides;

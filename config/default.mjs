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
  perspectives: [
    {
      label: 'Default',
      layout: {
        type: 'columns',
        contents: [
          {
            type: 'stack',
            contents: [
              { type: 'panel', component: 'map' },
              { type: 'panel', component: 'uav-list' },
              { type: 'panel', component: 'three-d-view' },
            ],
          },
          {
            type: 'rows',
            contents: [
              {
                type: 'stack',
                contents: [
                  { type: 'panel', component: 'lcd-clock-panel' },
                  { type: 'panel', component: 'saved-location-list' },
                  { type: 'panel', component: 'layer-list' },
                ],
                height: 25,
              },
              {
                type: 'stack',
                contents: [
                  { type: 'panel', component: 'show-control' },
                  { type: 'panel', component: 'light-control' },
                ],
              },
            ],
            width: 25,
          },
        ],
      },
    },
    {
      label: 'Show',
      hasHeaders: false,
      layout: {
        type: 'columns',
        contents: [
          { type: 'panel', component: 'show-control', width: 60 },
          {
            type: 'rows',
            contents: [
              { type: 'panel', component: 'lcd-clock-panel', height: 30 },
              { type: 'panel', component: 'uav-list' },
            ],
          },
        ],
      },
    },
    {
      label: 'Map',
      hasHeaders: false,
      isFixed: true,
      layout: {
        type: 'columns',
        contents: [
          { type: 'panel', component: 'map', width: 80 },
          {
            type: 'rows',
            contents: [
              { type: 'panel', component: 'saved-location-list', height: 30 },
              { type: 'panel', component: 'layer-list' },
            ],
          },
        ],
      },
    },
  ],
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

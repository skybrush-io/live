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
              { type: 'panel', component: 'map', id: 'map' },
              { type: 'panel', component: 'uav-list', id: 'uavs' },
              { type: 'panel', component: 'three-d-view', id: 'threeDView' },
            ],
          },
          {
            type: 'rows',
            contents: [
              {
                type: 'stack',
                contents: [
                  { type: 'panel', component: 'lcd-clock-panel', id: 'clocks' },
                  {
                    type: 'panel',
                    component: 'saved-location-list',
                    id: 'locations',
                  },
                  { type: 'panel', component: 'layer-list', id: 'layers' },
                ],
                height: 25,
              },
              {
                type: 'stack',
                contents: [
                  { type: 'panel', component: 'show-control', id: 'show' },
                  { type: 'panel', component: 'light-control', id: 'lights' },
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
      hideHeaders: true,
      layout: {
        type: 'columns',
        contents: [
          { type: 'panel', component: 'show-control', width: 60, id: 'show' },
          {
            type: 'rows',
            contents: [
              {
                type: 'panel',
                component: 'lcd-clock-panel',
                height: 30,
                id: 'clocks',
              },
              { type: 'panel', component: 'uav-list', id: 'uavs' },
            ],
          },
        ],
      },
    },
    {
      label: 'Map',
      hideHeaders: true,
      isFixed: true,
      layout: {
        type: 'columns',
        contents: [
          { type: 'panel', component: 'map', width: 80, id: 'map' },
          {
            type: 'rows',
            contents: [
              {
                type: 'panel',
                component: 'saved-location-list',
                height: 30,
                id: 'locations',
              },
              { type: 'panel', component: 'layer-list', id: 'layers' },
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

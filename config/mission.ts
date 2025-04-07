/**
 * @file Configuration override for interactive mission planning, editing,
 * execution and monitoring.
 */

import { type ConfigOverrides } from 'config-overrides';

import baseline from './baseline';

const overrides: ConfigOverrides = {
  electronBuilder: {
    appId: 'com.collmot.skybrush.live-mission',
    productName: 'Skybrush Live Mission',
  },

  features: {
    missionEditor: true,
    safetySettings: true,
  },

  map: {
    drawingTools: [...baseline.map.drawingTools, ['add-waypoint']],
  },

  perspectives: [
    {
      label: 'Mission',
      layout: {
        type: 'columns',
        contents: [
          {
            type: 'rows',
            contents: [
              {
                type: 'panel',
                component: 'uav-list',
                id: 'uavList',
                height: 35,
              },
              {
                type: 'stack',
                contents: [
                  { type: 'panel', component: 'map', id: 'map' },
                  {
                    type: 'panel',
                    component: 'three-d-view',
                    id: 'threeDView',
                  },
                ],
              },
            ],
          },
          {
            type: 'rows',
            contents: [
              {
                type: 'stack',
                contents: [
                  { type: 'panel', component: 'feature-list', id: 'features' },
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
                type: 'panel',
                component: 'mission-editor',
                id: 'missionEditor',
              },
            ],
            width: 20,
          },
        ],
      },
    },
  ],
};

export default overrides;

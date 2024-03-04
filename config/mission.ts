/**
 * @file Configuration override for interactive mission planning, editing,
 * execution and monitoring.
 */

import { type ConfigOverrides } from 'config-overrides';

import defaults from './defaults';

const overrides: ConfigOverrides = {
  features: {
    missionEditor: true,
  },

  map: {
    drawingTools: [...defaults.map.drawingTools, ['add-waypoint']],
  },
};

export default overrides;

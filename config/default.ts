/**
 * @file Default configuration override.
 *
 * Enables the LED-show feature (editor, JR-board control and simulation
 * panels) so they are available in the standard `npm start` build.
 */

import { type ConfigOverrides } from 'config-overrides';

const overrides: ConfigOverrides = {
  features: {
    ledShow: true,
  },
};

export default overrides;

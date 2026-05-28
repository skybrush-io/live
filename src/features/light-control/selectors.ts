/**
 * Returns whether the light control panel is currently activated.
 */
import type { AppSelector } from '~/store/reducers';

/**
 * Returns whether the light control panel is currently activated.
 */
export const isLightControlActive: AppSelector<boolean> = (state) =>
  state.lightControl.active;

/**
 * Returns the currently selected color in the light control panel, in hex
 * notation.
 */
export const getCurrentColorInLightControlPanel: AppSelector<string> = (
  state
) => state.lightControl.color;

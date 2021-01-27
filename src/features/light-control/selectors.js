/**
 * Returns whether the light control panel is currently activated.
 */
export function isLightControlActive(state) {
  return state.lightControl.active;
}

/**
 * Returns the currently selected color in the light control panel, in hex
 * notation.
 */
export function getCurrentColorInLightControlPanel(state) {
  return state.lightControl.color;
}

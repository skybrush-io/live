export function getNearestFeatureIdForTooltip(state) {
  return state.session?.featureIdForTooltip;
}

export function isBroadcast(state) {
  return state.session?.broadcast;
}

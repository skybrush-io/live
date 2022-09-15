export function detachedPanels(state) {
  return state.detachablePanels.detachedPanels;
}

export function isDetached(state, panelName) {
  return state.detachablePanels.detachedPanels.some(
    (p) => p.name === panelName
  );
}

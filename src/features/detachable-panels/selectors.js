export function isDetached(state, panelTitle) {
  // return Boolean(state.detachedPanels.some((p) => p.title === panelTitle));
  return state.detachablePanels.detachedPanels.some(
    (p) => p.title === panelTitle
  );
}

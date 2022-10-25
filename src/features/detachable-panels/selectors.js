export const detachedPanels = (state) => state.detachablePanels.detachedPanels;

export const isDetached = (state, name) =>
  state.detachablePanels.detachedPanels.includes(name);

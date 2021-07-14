export function getPendingUAVId(state) {
  return state.hotkeys.pendingUAVId;
}

export function isHotkeyDialogVisible(state) {
  return state.hotkeys.dialogVisible;
}

export function isPendingUAVIdOverlayVisible(state) {
  return state.hotkeys.pendingUAVId.length > 0;
}

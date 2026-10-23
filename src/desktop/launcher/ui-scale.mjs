import { BrowserWindow } from 'electron';

/**
 * Makes child windows created by the given web contents inherit its zoom
 * factor.
 *
 * @param {Electron.WebContents} webContents  the web contents of the parent
 */
export const propagateUIScaleToChildWindows = (webContents) => {
  webContents.on('did-create-window', (childWindow) => {
    childWindow.webContents.once('did-finish-load', () => {
      childWindow.webContents.setZoomFactor(webContents.getZoomFactor());
    });
  });
};

const MIN_UI_SCALE = 0.5;
const MAX_UI_SCALE = 3;

/**
 * Sets the zoom factor of all windows of the application. Invalid values are
 * ignored and out-of-range values are clamped.
 *
 * @param {number} scale  the zoom factor to use, 1 meaning 100%
 */
export const setUIScale = (scale) => {
  if (!Number.isFinite(scale)) {
    return;
  }

  const zoomFactor = Math.min(Math.max(scale, MIN_UI_SCALE), MAX_UI_SCALE);
  for (const window of BrowserWindow.getAllWindows()) {
    window.webContents.setZoomFactor(zoomFactor);
  }
};

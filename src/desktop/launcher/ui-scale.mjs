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

/**
 * Sets the zoom factor of all windows of the application.
 *
 * @param {number} scale  the zoom factor to use, 1 meaning 100%
 */
export const setUIScale = (scale) => {
  for (const window of BrowserWindow.getAllWindows()) {
    window.webContents.setZoomFactor(scale);
  }
};

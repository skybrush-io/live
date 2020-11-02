const { BrowserWindow } = require('electron');

/**
 * Returns a reference to the main window of the application.
 *
 * @return {Object} the main window of the application, or undefined if there
 *         is no main window at the moment
 */
const getMainWindow = () => {
  // Here we (ab)use the fact that there will be only one window in Skybrush
  // Live, ever.
  const windows = BrowserWindow.getAllWindows();
  return windows.length > 0 ? windows[windows.length - 1] : undefined;
};

module.exports = {
  getMainWindow,
};

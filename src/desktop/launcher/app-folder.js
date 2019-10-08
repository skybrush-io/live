const { app } = require('electron');
const path = require('path');

/**
 * Returns the name of the folder that contains the main executable of the
 * application.
 *
 * @return {string} the name of the folder that contains the main executable
 *         of the application
 */
module.exports = () => path.dirname(app.getPath('exe'));

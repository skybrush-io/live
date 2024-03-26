import path from 'node:path';

import { app } from 'electron';

/**
 * Returns the name of the folder that contains the main executable of the
 * application.
 *
 * @return {string} the name of the folder that contains the main executable
 *         of the application
 */
const getApplicationFolder = () => path.dirname(app.getPath('exe'));

export default getApplicationFolder;

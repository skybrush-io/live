/**
 * @file Defines the singleton instance of the flock that the application
 * manages.
 */

import Flock from './model/flock';

/**
 * The singleton flock instance that the application manages.
 */
const flock = new Flock();

export default flock;

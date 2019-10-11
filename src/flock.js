/**
 * @file Defines the singleton instance of the flock that the application
 * manages.
 */

import React from 'react';
import FlockModel from './model/flock';

/**
 * The singleton flock instance that the application manages.
 */
const flock = new FlockModel();

/**
 * React context that exposes the flock instance to components.
 */
export const Flock = React.createContext();

export default flock;

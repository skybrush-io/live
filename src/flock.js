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

/**
 * Higher order component that propagates the flock passed in the context
 * as props into the wrapped component.
 */
export const injectFlockFromContext = (BaseComponent) =>
  React.forwardRef((props, ref) => (
    <Flock.Consumer>
      {(flock) => <BaseComponent {...props} ref={ref} flock={flock} />}
    </Flock.Consumer>
  ));

export default flock;

/**
 * @file Defines the singleton instance of the flock that the application
 * manages.
 */

import * as React from 'react';
import FlockModel from './model/flock';

/**
 * The singleton flock instance that the application manages.
 */
const flock = new FlockModel();

/**
 * React context that exposes the flock instance to components.
 */
export const Flock = React.createContext<FlockModel>(flock);

/**
 * Higher order component that propagates the flock passed in the context
 * as props into the wrapped component.
 */
export const injectFlockFromContext = <T, P>(
  BaseComponent: React.ComponentType<P>
): React.ForwardRefExoticComponent<
  React.PropsWithoutRef<P> & React.RefAttributes<T>
> =>
  React.forwardRef((props: P, ref: React.ForwardedRef<T>) => (
    <Flock.Consumer>
      {(flock): JSX.Element => (
        <BaseComponent {...props} ref={ref} flock={flock} />
      )}
    </Flock.Consumer>
  ));

export default flock;

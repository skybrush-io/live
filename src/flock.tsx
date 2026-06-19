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
export const injectFlockFromContext = <
  TElement,
  TProps extends { ref?: React.Ref<TElement>; flock: FlockModel },
>(
  Component: React.ComponentType<TProps>
): React.ForwardRefExoticComponent<
  React.PropsWithoutRef<TProps> & React.RefAttributes<TElement>
> =>
  React.forwardRef<TElement, TProps>((props, ref) => (
    <Flock.Consumer>
      {(flock) => <Component {...(props as TProps)} ref={ref} flock={flock} />}
    </Flock.Consumer>
  ));

export default flock;

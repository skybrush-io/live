import { withErrorBoundary as withErrorBoundary_ } from 'react-error-boundary';

import { ErrorHandler } from '../error-handling';

/**
 * A React higher order component that can be used to provide other
 * React components with an error boundary that protects their
 * `render()` method from leaking errors and crashing the application.
 *
 * @param  {React.Component}  component  the component to wrap
 * @return {React.Component}  the original component extended with an
 *         appropriate error handling mechanism
 */
export default component => {
  return withErrorBoundary_(component, ErrorHandler);
};

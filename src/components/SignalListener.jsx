import { useEffect } from 'react';

/**
 * Component that adds a signal handler to a given signal such that the
 * handler gets invoked every time the signal is dispatched.
 *
 * @param {object} context      context object to bind the value of 'this' to
 *                              in the signal handler
 * @param {[type]} onDispatched handler to call when the signal is dispatched
 * @param {[type]} target       the signal to attach the handler to
 */
export const SignalListener = ({ context, onDispatched, target }) => {
  useEffect(() => {
    if (target) {
      const binding = target.add(onDispatched, context);
      return () => target.detach(binding);
    }
  });
  return null;
};

export default SignalListener;

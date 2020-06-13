/**
 * @file The global snackbar at the bottom of the main window.
 */

import PropTypes from 'prop-types';
import { useEffect } from 'react';
import { connect } from 'react-redux';
import { useToasts } from 'react-toast-notifications';

import { selectActiveNotification } from './selectors';
import { MessageSemantics } from './types';

const semanticsToAppearance = {
  [MessageSemantics.INFO]: 'info',
  [MessageSemantics.SUCCESS]: 'success',
  [MessageSemantics.WARNING]: 'warning',
  [MessageSemantics.ERROR]: 'error',
};

/**
 * Presentation component for the global snackbar at the bottom of the main
 * window.
 *
 * @returns  {Object}  the rendered snackbar component
 */
const ToastNotificationManager = ({ notification }) => {
  const { addToast } = useToasts();

  useEffect(() => {
    const { message, semantics, permanent } = notification;
    if (message) {
      addToast(message, {
        appearance: semanticsToAppearance[semantics] || 'info',
        autoDismiss: !permanent,
      });
    }
  }, [addToast, notification]);

  return null;
};

ToastNotificationManager.propTypes = {
  notification: PropTypes.shape({
    message: PropTypes.string.isRequired,
    permanent: PropTypes.bool,
    semantics: PropTypes.oneOf(Object.values(MessageSemantics)).isRequired,
  }),
};

/**
 * Global snackbar at the bottom of the main window.
 */
export default connect(
  // mapStateToProps
  (state) => ({
    notification: selectActiveNotification(state),
  }),
  // mapDispatchToProps
  {}
)(ToastNotificationManager);

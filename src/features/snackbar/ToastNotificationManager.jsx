/**
 * @file The global snackbar at the bottom of the main window.
 */

import PropTypes from 'prop-types';
import { useEffect } from 'react';
import { connect } from 'react-redux';
import { useToasts } from 'react-toast-notifications';

import { MessageSemantics } from '~/features/snackbar/types';

const semanticsToAppearance = {
  [MessageSemantics.INFO]: 'info',
  [MessageSemantics.SUCCESS]: 'success',
  [MessageSemantics.WARNING]: 'warning',
  [MessageSemantics.ERROR]: 'error'
};

/**
 * Presentation component for the global snackbar at the bottom of the main
 * window.
 *
 * @returns  {Object}  the rendered snackbar component
 */
const ToastNotificationManager = ({
  message,
  messageId,
  permanent,
  semantics
}) => {
  const { addToast } = useToasts();
  useEffect(() => {
    console.log(semantics);
    addToast(message, {
      appearance: semanticsToAppearance[semantics] || 'info',
      autoDismiss: !permanent
    });
  }, [addToast, message, messageId, semantics, permanent]);
  return null;
};

ToastNotificationManager.propTypes = {
  message: PropTypes.string.isRequired,
  permanent: PropTypes.bool,
  semantics: PropTypes.oneOf(Object.values(MessageSemantics)).isRequired
};

/**
 * Global snackbar at the bottom of the main window.
 */
export default connect(
  // mapStateToProps
  state => state.snackbar,
  // mapDispatchToProps
  {}
)(ToastNotificationManager);

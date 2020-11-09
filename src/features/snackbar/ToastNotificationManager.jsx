/**
 * @file The global snackbar at the bottom of the main window.
 */

import PropTypes from 'prop-types';
import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import { useToasts } from 'react-toast-notifications';

import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import { styled } from '@material-ui/core/styles';

import { selectActiveNotification } from './selectors';
import { MessageSemantics } from './types';

const semanticsToAppearance = {
  [MessageSemantics.INFO]: 'info',
  [MessageSemantics.SUCCESS]: 'success',
  [MessageSemantics.WARNING]: 'warning',
  [MessageSemantics.ERROR]: 'error',
};

const ToastNotificationButton = styled(Button)({
  border: '1px solid currentColor',
  color: 'inherit',
});

/**
 * Function that creates a React content node to show for the given notification.
 */
const createContentNode = (notification, dispatch) => {
  const { buttons, message, header } = notification;
  let result = message;

  if (Array.isArray(buttons) && buttons.length > 0) {
    const buttonComponents = buttons.map(({ label, action }, index) => (
      <ToastNotificationButton
        // eslint-disable-next-line react/no-array-index-key
        key={index}
        size='small'
        variant='outlined'
        onClick={() => dispatch(action)}
      >
        {label}
      </ToastNotificationButton>
    ));

    result = (
      <div>
        {result}
        <Box
          display='flex'
          flexDirection='row'
          justifyContent='space-around'
          mt={2}
        >
          {buttonComponents}
        </Box>
      </div>
    );
  }

  if (header && header.length > 0) {
    result = (
      <div>
        <div>
          <strong>{header}</strong>
        </div>
        {result}
      </div>
    );
  }

  return result;
};

/**
 * Presentation component for the global snackbar at the bottom of the main
 * window.
 *
 * @returns  {Object}  the rendered snackbar component
 */
const ToastNotificationManager = ({ dispatch, notification }) => {
  const { addToast } = useToasts();

  useEffect(() => {
    const { semantics, permanent } = notification;
    const content = createContentNode(notification, dispatch);
    if (content) {
      addToast(content, {
        appearance: semanticsToAppearance[semantics] || 'info',
        autoDismiss: !permanent,
      });
    }
  }, [addToast, dispatch, notification]);

  return null;
};

ToastNotificationManager.propTypes = {
  dispatch: PropTypes.func.isRequired,
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
  })
)(ToastNotificationManager);

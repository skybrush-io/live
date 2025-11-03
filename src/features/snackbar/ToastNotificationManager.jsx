/**
 * @file The global snackbar of the main window.
 */

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { styled } from '@mui/material/styles';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { useToasts } from 'react-toast-notifications';

import { useSignal } from '~/hooks';

import { SNACKBAR_TRANSITION_DURATION } from './constants';
import snackbarSignal from './signal';
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
const createContentNode = ({ buttons, message, header }, dispatch) => {
  let result = message;

  if (Array.isArray(buttons) && buttons.length > 0) {
    const buttonComponents = buttons.map(
      ({ action, label, ...rest }, index) => (
        <ToastNotificationButton
          // eslint-disable-next-line react/no-array-index-key
          key={index}
          size='small'
          variant='outlined'
          style={{ flexShrink: 0 }}
          onClick={() => dispatch(action)}
          {...rest}
        >
          {label}
        </ToastNotificationButton>
      )
    );

    result = (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        {result}
        {buttonComponents}
      </Box>
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
 * Presentation component for the global snackbar of the main window.
 *
 * @returns  {Object}  the rendered snackbar component
 */
const ToastNotificationManager = ({ dispatch }) => {
  const { addToast, toastStack, removeToast } = useToasts();

  useSignal(
    snackbarSignal,
    ({
      buttons,
      header,
      message,
      permanent = false,
      semantics = MessageSemantics.DEFAULT,
      timeout,
      topic,
    }) => {
      const match = topic && toastStack.find((t) => t?.topic === topic);

      const content = createContentNode({ buttons, message, header }, dispatch);
      const options = {
        appearance: semanticsToAppearance[semantics] || 'info',
        autoDismiss: !permanent,
        // We don't want to override the default, and `undefined` is not ignored
        // internally, so we only pass the parameter, if it's actually present
        ...(timeout && { autoDismissTimeout: timeout }),
        topic,
      };

      if (match) {
        // If a previous notification with the same topic exists, remove it and
        // delay the showing of the next one until it has finished disappearing
        removeToast(match.id);
        if (content) {
          setTimeout(() => {
            addToast(content, options);
          }, SNACKBAR_TRANSITION_DURATION);
        }
      } else {
        if (content) {
          addToast(content, options);
        }
      }
    }
  );

  return null;
};

ToastNotificationManager.propTypes = {
  dispatch: PropTypes.func.isRequired,
};

/**
 * Global snackbar at the bottom of the main window.
 */
export default connect()(ToastNotificationManager);
// We only need `connect` to get `dispatch` as a prop.

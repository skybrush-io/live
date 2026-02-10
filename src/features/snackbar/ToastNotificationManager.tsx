/**
 * @file The global snackbar of the main window.
 */

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { styled } from '@mui/material/styles';
import type { ReactNode } from 'react';
import { useDispatch } from 'react-redux';
import { type AppearanceTypes, useToasts } from 'react-toast-notifications';

import Countdown from '~/components/Countdown';
import { useSignal } from '~/hooks';
import type { AppDispatch } from '~/store/reducers';

import { SNACKBAR_TRANSITION_DURATION } from './constants';
import snackbarSignal from './signal';
import { MessageSemantics, type Notification } from './types';

const semanticsToAppearance: Partial<
  Record<MessageSemantics, AppearanceTypes>
> = {
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
const createContentNode = (
  { buttons, countdown, message, header, timeout }: Notification,
  dispatch: AppDispatch
): ReactNode => {
  let result: ReactNode = message;

  if (countdown && timeout !== undefined && Number.isFinite(timeout)) {
    result = (
      <>
        {result}&nbsp;({<Countdown seconds={timeout / 1000} />})
      </>
    );
  }

  if (Array.isArray(buttons) && buttons.length > 0) {
    const buttonComponents = buttons.map(
      ({ action, label, ...rest }, index: number) => (
        <ToastNotificationButton
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

const ToastNotificationManager = () => {
  const dispatch = useDispatch();
  const { addToast, toastStack, removeToast } = useToasts();

  useSignal(
    snackbarSignal,
    ({
      buttons,
      countdown,
      header,
      message,
      permanent = false,
      semantics = MessageSemantics.DEFAULT,
      timeout,
      topic,
    }: Notification) => {
      const match =
        topic &&
        toastStack.find((t) => (t as { topic?: string })?.topic === topic);

      const content = createContentNode(
        { buttons, countdown, message, header, timeout },
        dispatch
      );
      const options = {
        appearance: semanticsToAppearance[semantics] ?? 'info',
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

export default ToastNotificationManager;

import Alert, { type AlertColor } from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { styled } from '@mui/material/styles';
import { type ReactNode } from 'react';
import toast from 'react-hot-toast';
import { useDispatch } from 'react-redux';

import Countdown from '~/components/Countdown';

import { TOAST_WIDTH } from './constants';
import { MessageSemantics, type Notification } from './types';

const ToastNotificationButton = styled(Button)({
  border: '1px solid currentColor',
  color: 'inherit',
});

const StyledAlert = styled(Alert)({
  minWidth: TOAST_WIDTH,
  maxWidth: TOAST_WIDTH,
  width: TOAST_WIDTH,
  '> .MuiAlert-message': {
    flex: 1,
  },
});

const semanticsToSeverity: Record<MessageSemantics, AlertColor> = {
  [MessageSemantics.DEFAULT]: 'info',
  [MessageSemantics.INFO]: 'info',
  [MessageSemantics.SUCCESS]: 'success',
  [MessageSemantics.WARNING]: 'warning',
  [MessageSemantics.ERROR]: 'error',
};

type ToastContentProps = {
  notification: Notification;
};

const ToastContent = ({ notification }: ToastContentProps) => {
  const dispatch = useDispatch();
  const { message, buttons, countdown, timeout } = notification;

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
      ({ action, label, ...rest }, index) => (
        <ToastNotificationButton
          key={index}
          size='small'
          variant='outlined'
          style={{ flexShrink: 0 }}
          onClick={() => dispatch(action as never)}
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
          gap: 1,
        }}
      >
        {result}
        {buttonComponents}
      </Box>
    );
  }

  return result;
};

type ToastProps = ToastContentProps & {
  toastId: string;
};

const Toast = ({ toastId, notification }: ToastProps) => {
  return (
    <StyledAlert
      severity={
        semanticsToSeverity[notification.semantics ?? MessageSemantics.DEFAULT]
      }
      onClose={() => {
        toast.dismiss(toastId);
      }}
    >
      <ToastContent notification={notification} />
    </StyledAlert>
  );
};

export default Toast;

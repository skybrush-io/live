import Alert, { type AlertColor } from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import LinearProgress from '@mui/material/LinearProgress';
import { styled } from '@mui/material/styles';
import { type ReactNode } from 'react';
import toast from 'react-hot-toast';
import { useDispatch } from 'react-redux';

import Countdown from '~/components/Countdown';
import { useCountdown } from '~/hooks/useCountdown';

import { TOAST_WIDTH } from './constants';
import { MessageSemantics, type Notification } from './types';

const PROGRESS_BAR_HEIGHT = 4;

const ToastNotificationButton = styled(Button)({
  border: '1px solid currentColor',
  color: 'inherit',
  flexShrink: 0,
});

const StyledAlert = styled(Alert)({
  minWidth: TOAST_WIDTH,
  maxWidth: TOAST_WIDTH,
  width: TOAST_WIDTH,
  position: 'relative',
  // Slightly smaller paddings than the default, increased bottom padding
  // to compensate for the progress bar's height (positioned by CSS).
  padding: `4px 10px ${4 + PROGRESS_BAR_HEIGHT}px 10px`,
  '> .MuiAlert-message': {
    flex: 1,
    '> .MuiLinearProgress-root': {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: PROGRESS_BAR_HEIGHT,
      borderRadius: '0px 0px 4px 4px',
    },
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
  const { pause, progress, resume } = useCountdown(notification.timeout);
  const effectiveProgress =
    notification.timeout === undefined ? progress : 100 - progress;
  const severity =
    semanticsToSeverity[notification.semantics ?? MessageSemantics.DEFAULT];

  return (
    <StyledAlert
      severity={severity}
      onClose={() => {
        toast.dismiss(toastId);
      }}
      onMouseEnter={pause}
      onMouseLeave={resume}
    >
      <ToastContent notification={notification} />
      <LinearProgress
        value={effectiveProgress}
        variant='determinate'
        color={severity}
      />
    </StyledAlert>
  );
};

export default Toast;

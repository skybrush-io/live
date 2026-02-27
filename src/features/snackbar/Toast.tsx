import Alert, { type AlertColor } from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { styled } from '@mui/material/styles';
import { type ReactNode } from 'react';
import toast from 'react-hot-toast';
import { useDispatch } from 'react-redux';

import { MessageSemantics, type Notification } from './types';

const ToastNotificationButton = styled(Button)({
  border: '1px solid currentColor',
  color: 'inherit',
});

const StyledAlert = styled(Alert)({
  minWidth: '400px',
  maxWidth: '400px',
  width: '400px',
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
  const { buttons, message, header } = notification;

  let result: ReactNode = message;

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

type ToastProps = ToastContentProps & {
  toastId: string;
};

const Toast = ({ toastId, notification }: ToastProps) => {
  return (
    <StyledAlert
      severity={
        semanticsToSeverity[notification.semantics ?? MessageSemantics.DEFAULT]
      }
      variant='filled'
      onClose={() => {
        toast.dismiss(toastId);
      }}
    >
      <ToastContent notification={notification} />
    </StyledAlert>
  );
};

export default Toast;

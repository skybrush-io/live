/**
 * @file React component for message input with history.
 */

import TextField, { type TextFieldProps } from '@mui/material/TextField';
import React, {
  useCallback,
  useEffect,
  useState,
  type ChangeEvent,
  type FocusEvent,
  type KeyboardEvent,
} from 'react';

type ElementWithFocusRestorationTarget = Element & {
  focusRestorationTarget?: HTMLElement | null;
};

type MessageFieldProps = Omit<
  TextFieldProps,
  'onBlur' | 'onChange' | 'onKeyDown' | 'value'
> & {
  history?: string[];
  onEscape: (event: KeyboardEvent<HTMLInputElement>) => void;
  onSubmit: (message: string) => void;
};

const MessageField = React.forwardRef<HTMLDivElement, MessageFieldProps>(
  ({ history = [], onEscape, onSubmit, ...rest }, ref) => {
    const [message, setMessage] = useState('');
    const handleChange = useCallback(
      (event: ChangeEvent<HTMLInputElement>) => {
        setMessage(event.target.value);
      },
      [setMessage]
    );

    const [historyIndex, setHistoryIndex] = useState(0);
    useEffect(() => {
      setMessage(history[history.length - historyIndex] ?? '');
    }, [history, historyIndex]);

    const handleKeyDown = useCallback(
      (event: KeyboardEvent<HTMLInputElement>) => {
        switch (event.key) {
          case 'Enter': {
            if (message.length > 0) {
              onSubmit(message);
              setMessage('');
              setHistoryIndex(0);
            }

            break;
          }

          case 'Escape': {
            onEscape(event);

            break;
          }

          case 'ArrowUp': {
            setHistoryIndex((index) => Math.min(index + 1, history.length));

            break;
          }

          case 'ArrowDown': {
            setHistoryIndex((index) => Math.max(index - 1, 0));

            break;
          }

          // No default
        }
      },
      [history, message, onEscape, onSubmit]
    );

    const handleBlur = useCallback(
      (
        event: FocusEvent<HTMLInputElement, ElementWithFocusRestorationTarget>
      ) => {
        if (event.relatedTarget) {
          event.relatedTarget.focusRestorationTarget = event.target;
        }
      },
      []
    );

    return (
      <TextField
        ref={ref}
        value={message}
        onBlur={handleBlur}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        {...rest}
      />
    );
  }
);

MessageField.displayName = 'MessageField';

export default MessageField;

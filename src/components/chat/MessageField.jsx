/**
 * @file React component for message input with history.
 */

import PropTypes from 'prop-types';
import React, { useCallback, useEffect, useState } from 'react';

import TextField from '@material-ui/core/TextField';

const MessageField = React.forwardRef(
  ({ history, onEscape, onSubmit, ...rest }, ref) => {
    const [message, setMessage] = useState('');
    const handleChange = useCallback(
      (event) => {
        setMessage(event.target.value);
      },
      [setMessage]
    );

    const [historyIndex, setHistoryIndex] = useState(0);
    useEffect(() => {
      setMessage(history[history.length - historyIndex] ?? '');
    }, [history, historyIndex]);

    const handleKeyDown = useCallback(
      (event) => {
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

    const handleBlur = useCallback((event) => {
      if (event.relatedTarget) {
        event.relatedTarget.focusRestorationTarget = event.target;
      }
    }, []);

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

MessageField.propTypes = {
  history: PropTypes.arrayOf(PropTypes.string),
  onEscape: PropTypes.func,
  onSubmit: PropTypes.func,
};

export default MessageField;

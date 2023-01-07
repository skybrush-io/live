/**
 * @file React component for message input with history.
 */

import PropTypes from 'prop-types';
import React, { useCallback, useEffect, useState } from 'react';

import TextField from '@material-ui/core/TextField';

const MessageField = React.forwardRef(({ history, onSubmit, ...rest }, ref) => {
  const [message, setMessage] = useState('');
  const onChange = (event) => {
    setMessage(event.target.value);
  };

  const [historyIndex, setHistoryIndex] = useState(0);
  useEffect(() => {
    setMessage(history[history.length - historyIndex] ?? '');
  }, [history, historyIndex]);

  const onKeyDown = useCallback(
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
    [history, message, onSubmit]
  );

  return (
    <TextField
      ref={ref}
      value={message}
      onChange={onChange}
      onKeyDown={onKeyDown}
      {...rest}
    />
  );
});

MessageField.propTypes = {
  history: PropTypes.arrayOf(PropTypes.string),
  onSubmit: PropTypes.func,
};

export default MessageField;

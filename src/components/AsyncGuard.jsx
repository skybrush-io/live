import Error from '@mui/icons-material/Error';
import Button from '@mui/material/Button';
import PropTypes from 'prop-types';
import React from 'react';
import { useAsyncRetry } from 'react-use';

import BackgroundHint from '@skybrush/mui-components/lib/BackgroundHint';
import LargeProgressIndicator from '@skybrush/mui-components/lib/LargeProgressIndicator';

const AsyncGuard = ({
  children,
  func,
  errorMessage,
  loadingMessage,
  style,
}) => {
  // style prop is forwarded to make this component play nicely when it is used
  // as a top-level component in a transition

  const state = useAsyncRetry(() => (func ? func() : undefined), [func]);

  if (state.error && !state.loading) {
    return (
      <BackgroundHint
        icon={<Error />}
        text={errorMessage || 'An unexpected error happened'}
        button={<Button onClick={state.retry}>Try again</Button>}
        style={style}
      />
    );
  }

  if (state.loading) {
    return (
      <LargeProgressIndicator
        fullHeight
        label={loadingMessage || 'Please wait, loading...'}
        style={style}
      />
    );
  }

  return children ? children(state.value) : null;
};

AsyncGuard.propTypes = {
  children: PropTypes.func,
  func: PropTypes.func,
  errorMessage: PropTypes.string,
  loadingMessage: PropTypes.string,
  style: PropTypes.object,
};

export default AsyncGuard;

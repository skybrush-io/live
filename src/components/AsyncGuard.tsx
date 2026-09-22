import Error from '@mui/icons-material/Error';
import Button from '@mui/material/Button';
import { useAsyncRetry } from 'react-use';

import {
  BackgroundHint,
  LargeProgressIndicator,
} from '@skybrush/mui-components';

type Props<T> = {
  children?: (value: T | undefined) => React.ReactNode;
  func?: () => Promise<T>;
  errorMessage?: string;
  loadingMessage?: string;
  style?: React.CSSProperties;
};

function AsyncGuard<T>({
  children,
  func,
  errorMessage,
  loadingMessage,
  style,
}: Props<T>) {
  // style prop is forwarded to make this component play nicely when it is used
  // as a top-level component in a transition
  const state = useAsyncRetry(async () => (func ? func() : undefined), [func]);

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
}

export default AsyncGuard;

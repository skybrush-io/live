import type * as React from 'react';
import type { Status } from '@skybrush/app-theme-material-ui';

export type StatusLightProps = {
  inline?: boolean;
  size?: 'small' | 'normal' | 'large';
  status?: Status;
};

/**
 * Small component resembling a multi-color status light that can be used to
 * represent the state of a single step in a multi-step process.
 */
declare const StatusLight: ({
  inline,
  size,
  status,
  ...rest
}: StatusLightProps) => React.JSX.Element;
export default StatusLight;

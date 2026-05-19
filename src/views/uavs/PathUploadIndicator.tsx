import clsx from 'clsx';
import React, { type CSSProperties } from 'react';

import { StatusPill, type StatusPillProps } from '@skybrush/mui-components';

import {
  getPathUploadPillStyle,
  getPathUploadSemantics,
} from '~/features/uavs/pathUpload';

/** StatusPill forwards `style` at runtime but omits it from its public types. */
const StatusPillWithStyle = StatusPill as React.FC<
  StatusPillProps & { style?: CSSProperties }
>;

export type PathUploadIndicatorProps = Readonly<{
  className?: string;
  uploaded: boolean;
}>;

export const PathUploadIndicator = ({
  className,
  uploaded,
}: PathUploadIndicatorProps): React.JSX.Element => (
  <StatusPillWithStyle
    inline
    className={clsx(className)}
    status={getPathUploadSemantics(uploaded)}
    style={getPathUploadPillStyle(uploaded)}
  >
    {uploaded ? 'OK' : 'NO'}
  </StatusPillWithStyle>
);

export default PathUploadIndicator;

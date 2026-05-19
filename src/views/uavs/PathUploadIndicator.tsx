import clsx from 'clsx';
import React from 'react';

import { getPathUploadPillStyle } from '~/features/uavs/pathUpload';

import FilledListCell from './FilledListCell';

export type PathUploadIndicatorProps = Readonly<{
  className?: string;
  uploaded: boolean;
  width?: number;
}>;

export const PathUploadIndicator = ({
  className,
  uploaded,
  width,
}: PathUploadIndicatorProps): React.JSX.Element => (
  <FilledListCell
    className={clsx(className)}
    style={getPathUploadPillStyle(uploaded)}
    title={uploaded ? 'Path uploaded' : 'Path not uploaded'}
    width={width}
  >
    {uploaded ? 'OK' : 'NO'}
  </FilledListCell>
);

export default PathUploadIndicator;

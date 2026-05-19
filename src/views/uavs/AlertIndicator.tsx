import clsx from 'clsx';
import React from 'react';

import { getUavAlertPillStyle, type UavAlertResult } from '~/features/uavs/uavAlert';

import FilledListCell from './FilledListCell';

export type AlertIndicatorProps = Readonly<{
  alert: UavAlertResult;
  className?: string;
  width?: number;
}>;

export const AlertIndicator = ({
  alert,
  className,
  width,
}: AlertIndicatorProps): React.JSX.Element => (
  <FilledListCell
    className={clsx(className)}
    style={getUavAlertPillStyle(alert.level)}
    title={alert.title}
    width={width}
  >
    {alert.label}
  </FilledListCell>
);

export default AlertIndicator;

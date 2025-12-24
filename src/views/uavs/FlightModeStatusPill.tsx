import { Status } from '@skybrush/app-theme-mui';
import { StatusPill } from '@skybrush/mui-components';

import { abbreviateFlightMode, type FlightMode } from '~/model/enums';

export type FlightModeStatusPillProps = Readonly<{
  className?: string;
  mode?: FlightMode;
}>;

export const FlightModeStatusPill = ({
  mode,
  ...rest
}: FlightModeStatusPillProps) => (
  <StatusPill inline status={Status.OFF} {...rest}>
    {mode ? abbreviateFlightMode(mode) : '----'}
  </StatusPill>
);

export default FlightModeStatusPill;

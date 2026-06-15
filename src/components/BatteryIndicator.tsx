import Box from '@mui/material/Box';
import clsx from 'clsx';

import { makeStyles } from '@skybrush/app-theme-mui';

import Colors from '~/components/colors';

import { DEFAULT_BATTERY_FORMATTER, type BatteryFormatter } from './battery';

const useStyles = makeStyles((theme) => ({
  root: {
    // marginTop: theme.spacing(0.5),
    padding: '0 2px',
    textAlign: 'center',
    userSelect: 'none',
    width: '100%',
  },

  batteryFull: {
    color: Colors.success,
    fontWeight: 'bold',
  },

  batteryWarning: {
    backgroundColor: Colors.warning,
    borderRadius: `${Number(theme.shape.borderRadius) * 2}px`,
    color: theme.palette.getContrastText(Colors.warning),
  },

  batteryError: {
    backgroundColor: Colors.error,
    borderRadius: `${Number(theme.shape.borderRadius) * 2}px`,
    color: theme.palette.getContrastText(Colors.error),
    fontWeight: 'bold',
  },
}));

type BatteryIndicatorProps = {
  cellCount?: number;
  className?: string;
  charging?: boolean;
  formatter?: BatteryFormatter;
  percentage?: number;
  voltage?: number;
};

/**
 * Presentational component for a battery charge indicator.
 */
const BatteryIndicator = ({
  charging = false,
  className,
  cellCount,
  formatter = DEFAULT_BATTERY_FORMATTER,
  percentage,
  voltage,
}: BatteryIndicatorProps) => {
  const status = formatter.getBatteryStatus(voltage, percentage, cellCount);
  const label = formatter.getBatteryLabel(voltage, percentage, cellCount);
  const batteryIcon = formatter.getBatteryIcon(percentage, status, charging);

  const classes = useStyles();
  const rootClass = clsx(
    className,
    classes.root,
    classes[`battery${status}` as keyof ReturnType<typeof useStyles>]
  );

  return (
    <Box className={rootClass} sx={{ fontSize: 'small' }}>
      {batteryIcon}
      {label}
    </Box>
  );
};

export default BatteryIndicator;

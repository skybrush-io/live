import clsx from 'clsx';
import React from 'react';

import { makeStyles, type Theme } from '@material-ui/core/styles';
import { colorForStatus, Status } from '@skybrush/app-theme-material-ui';

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const createStyleForStatus = (status: Status, theme: Theme) => {
  const backgroundColor = colorForStatus(status);
  return {
    backgroundColor,
    color: theme.palette.getContrastText(backgroundColor),
  };
};

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const createStyleForHollowStatus = (status: Status) => {
  const color = colorForStatus(status);
  return { color };
};

const FLASH_STYLE = {
  animation: '$flash 0.5s infinite',
  animationDirection: 'alternate',
};

/* eslint-disable @typescript-eslint/naming-convention */
const useStyles = makeStyles(
  (theme: Theme) => ({
    root: {
      borderRadius: theme.spacing(1),
      color: theme.palette.primary.contrastText,
      fontSize: 'small',
      overflow: 'hidden',
      padding: `0 ${theme.spacing(0.5)}`,
      textAlign: 'center',
      textTransform: 'uppercase',
      userSelect: 'none',
      whiteSpace: 'nowrap',
    },

    fullWidth: {
      width: '100%',
    },

    'status-off': {
      backgroundColor: theme.palette.action.selected,
    },

    'status-info': createStyleForStatus(Status.INFO, theme),
    'status-waiting': createStyleForStatus(Status.WAITING, theme),
    'status-next': createStyleForStatus(Status.NEXT, theme),
    'status-success': createStyleForStatus(Status.SUCCESS, theme),
    'status-skipped': createStyleForStatus(Status.SKIPPED, theme),
    'status-warning': {
      ...createStyleForStatus(Status.WARNING, theme),
      fontWeight: 'bold',
    },
    'status-rth': {
      ...createStyleForStatus(Status.RTH, theme),
      ...FLASH_STYLE,
      fontWeight: 'bold',
    },
    'status-error': {
      ...createStyleForStatus(Status.ERROR, theme),
      fontWeight: 'bold',
    },

    'status-critical': {
      ...createStyleForStatus(Status.CRITICAL, theme),
      ...FLASH_STYLE,
      fontWeight: 'bold',
    },

    'status-missing': {},

    'status-hollow-off': {
      color: theme.palette.text.secondary,
    },

    'status-hollow-info': createStyleForHollowStatus(Status.INFO),
    'status-hollow-waiting': createStyleForHollowStatus(Status.WAITING),
    'status-hollow-next': createStyleForHollowStatus(Status.NEXT),
    'status-hollow-success': createStyleForHollowStatus(Status.SUCCESS),
    'status-hollow-skipped': createStyleForHollowStatus(Status.SKIPPED),
    'status-hollow-warning': {
      ...createStyleForHollowStatus(Status.WARNING),
      fontWeight: 'bold',
    },

    'status-hollow-rth': {
      ...createStyleForHollowStatus(Status.RTH),
      ...FLASH_STYLE,
      fontWeight: 'bold',
    },

    'status-hollow-error': {
      ...createStyleForHollowStatus(Status.ERROR),
      fontWeight: 'bold',
    },

    'status-hollow-critical': {
      ...createStyleForHollowStatus(Status.CRITICAL),
      ...FLASH_STYLE,
      fontWeight: 'bold',
    },

    'status-hollow-missing': {},

    '@keyframes flash': {
      '0%, 49%': {
        opacity: 0.5,
      },
      '50%, 100%': {
        opacity: 1,
      },
    },
  }),
  { name: 'StatusPill' }
);
/* eslint-enable @typescript-eslint/naming-convention */

type StatusPillProps = Readonly<{
  children?: React.ReactNode;
  className?: string;
  inline?: boolean;
  hollow?: boolean;
  status?: Status;
}>;

/**
 * Summary pill that can be placed below the drone avatar to show a single
 * line of additional textual information.
 */
const StatusPill = ({
  children,
  className,
  inline,
  hollow,
  status = Status.INFO,
  ...rest
}: StatusPillProps): JSX.Element => {
  const classes = useStyles();
  return (
    <div
      className={clsx(
        className,
        classes.root,
        !inline && classes.fullWidth,
        hollow
          ? classes[`status-hollow-${status}`]
          : classes[`status-${status}`]
      )}
      {...rest}
    >
      {children}
    </div>
  );
};

export default StatusPill;

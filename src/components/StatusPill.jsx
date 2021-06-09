import clsx from 'clsx';
import PropTypes from 'prop-types';
import React from 'react';

import { makeStyles } from '@material-ui/core/styles';
import { colorForStatus, Status } from '@skybrush/app-theme-material-ui';

const createStyleForStatus = (status, theme) => {
  const backgroundColor = colorForStatus(status);
  return {
    backgroundColor,
    color: theme.palette.getContrastText(backgroundColor),
  };
};

const createStyleForHollowStatus = (status) => {
  const color = colorForStatus(status);
  return { color };
};

const FLASH_STYLE = {
  animation: '$flash 0.5s infinite',
  animationDirection: 'alternate',
};

const useStyles = makeStyles(
  (theme) => ({
    root: {
      borderRadius: theme.spacing(1),
      color: theme.palette.getContrastText.primary,
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

/**
 * Summary pill that can be placed below the drone avatar to show a single
 * line of additional textual information.
 */
const StatusPill = ({
  children,
  className,
  inline,
  hollow,
  status,
  ...rest
}) => {
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

StatusPill.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
  hollow: PropTypes.bool,
  inline: PropTypes.bool,
  status: PropTypes.oneOf(Object.values(Status)),
};

StatusPill.defaultProps = {
  status: Status.INFO,
};

export default StatusPill;

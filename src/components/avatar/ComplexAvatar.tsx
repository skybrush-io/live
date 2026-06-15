import CircularProgress from '@mui/material/CircularProgress';
import clsx from 'clsx';

import { Colors, Status, makeStyles } from '@skybrush/app-theme-mui';
import type { SemanticAvatarProps } from '@skybrush/mui-components';
import { SemanticAvatar, StatusPill } from '@skybrush/mui-components';

import type { BatteryFormatter } from '~/components/battery';
import BatteryIndicator, {
  type BatteryIndicatorProps,
} from '~/components/BatteryIndicator';

const useStyles = makeStyles((theme) => ({
  avatarWrapper: {
    position: 'relative',
    '&:not(:last-child)': {
      marginBottom: theme.spacing(0.5),
    },

    '&::after': {
      background: Colors.error,
      boxShadow:
        '1px 1px 4px rgba(0, 0, 0, 0.6), 1px 1px 2px rgba(255, 255, 255, 0.3) inset',
      content: '""',
      height: 4,
      left: '50%',
      position: 'absolute',
      top: 'calc(50% - 2px)',
      transform: 'rotate(-45deg)',
      transition: 'left 300ms, width 300ms',
      width: '0%',
    },

    '&.crossed::after': {
      left: '-20%',
      width: '140%',
    },
  },

  avatarContent: {
    width: '100%',
    textAlign: 'center',
  },

  batteryStatus: {
    marginTop: theme.spacing(0.25),
  },

  gone: {
    opacity: 0.7,
  },

  hint: {
    fontSize: '0.75rem',
  },

  hintSeparator: {
    width: '75%',

    marginTop: 0,
    marginBottom: 2,

    border: '1px solid',
    borderBottomWidth: 0,

    opacity: 0.6,

    color: 'inherit',
  },

  progress: {
    position: 'absolute',
    top: -2,
    left: -2,
  },
}));

type ComplexAvatarProps = {
  AvatarProps?: Omit<SemanticAvatarProps, 'children' | 'status'>;
  batteryFormatter?: BatteryFormatter;
  batteryStatus?: Omit<BatteryIndicatorProps, 'className' | 'formatter'>;
  crossed?: boolean;
  details?: string;
  editing?: boolean;
  gone?: boolean;
  hint?: string;
  id?: string;
  label?: string;
  progress?: number;
  selected?: boolean;
  status?: Status;
  text?: string;
  textSemantics?: Status;
};

/**
 * Avatar that represents a single drone, docking station or some other object
 * in the system that has an ID.
 */
const ComplexAvatar = ({
  AvatarProps,
  batteryFormatter,
  batteryStatus,
  crossed,
  details,
  editing,
  gone,
  hint,
  id,
  label,
  progress,
  status = Status.OFF,
  text,
  textSemantics = Status.INFO,
}: ComplexAvatarProps) => {
  const classes = useStyles();
  const effectiveStatus = status === Status.INFO ? Status.SUCCESS : status;
  const effectiveHint = hint || (label === undefined || label === id ? '' : id);

  return (
    <>
      <div
        className={clsx(
          classes.avatarWrapper,
          crossed && 'crossed',
          gone && classes.gone
        )}
      >
        <SemanticAvatar
          status={editing ? Status.NEXT : effectiveStatus}
          {...AvatarProps}
        >
          <div className={classes.avatarContent}>
            {label === undefined ? id : label}
            <hr className={classes.hintSeparator} />
            <div className={classes.hint}>{effectiveHint || '—'}</div>
          </div>
        </SemanticAvatar>
        {progress !== undefined && progress > 0 && (
          <CircularProgress
            className={classes.progress}
            size={44}
            value={progress}
            variant='determinate'
          />
        )}
      </div>
      {(details || text) && (
        <StatusPill status={textSemantics}>{details || text}</StatusPill>
      )}
      {batteryStatus && (
        <BatteryIndicator
          className={classes.batteryStatus}
          formatter={batteryFormatter}
          {...batteryStatus}
        />
      )}
    </>
  );
};

export default ComplexAvatar;

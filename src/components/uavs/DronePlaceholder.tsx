import Avatar, { type AvatarProps } from '@mui/material/Avatar';
import { keyframes } from '@mui/styled-engine';
import clsx from 'clsx';
import createColor from 'color';

import { makeStyles } from '@skybrush/app-theme-mui';

import Colors from '~/components/colors';

const pulse = keyframes({
  '0%': {
    boxShadow: `0 0 8px 2px ${createColor(Colors.info).alpha(0)}`,
  },
  '100%': {
    boxShadow: `0 0 8px 2px ${Colors.info}`,
  },
});

const useStyles = makeStyles((theme) => ({
  root: {
    position: 'relative',
  },

  avatar: {
    backgroundColor: Colors.off,
    color: theme.palette.getContrastText(Colors.off),

    borderRadius: '25%',
  },

  'avatar-off': {
    opacity: 0.5,
  },

  'avatar-editing': {
    backgroundColor: Colors.info,
    color: theme.palette.getContrastText(Colors.info),
    animation: `${pulse} 0.5s infinite`,
    animationDirection: 'alternate',
  },

  'avatar-error': {
    backgroundColor: Colors.error,
    boxShadow: `0 0 8px 2px ${Colors.error}`,
    color: theme.palette.getContrastText(Colors.error),
  },

  'avatar-success': {
    backgroundColor: Colors.success,
    color: theme.palette.getContrastText(Colors.success),
  },
}));

type Props = {
  AvatarProps?: AvatarProps;
  editing?: boolean;
  label: React.ReactNode;
  status?: 'off' | 'editing' | 'error' | 'success';
};

/**
 * Placeholder component that can be used in the UAV list for slots where we
 * don't want to display a drone avatar but want to show a placeholder
 * instead that is of the same size as the avatar.
 */
const DronePlaceholder = ({
  AvatarProps,
  editing,
  label,
  status = 'off',
}: Props) => {
  const classes = useStyles();
  return (
    <div className={classes.root}>
      <Avatar
        className={clsx(
          classes.avatar,
          classes[`avatar-${editing ? 'editing' : status}`]
        )}
        {...AvatarProps}
      >
        {label}
      </Avatar>
    </div>
  );
};

export default DronePlaceholder;

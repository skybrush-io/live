/**
 * @file React component showing a marker line in a chat session.
 */

import clsx from 'clsx';
import TimeAgo from 'react-timeago';

import { makeStyles } from '@skybrush/app-theme-mui';

const useStyles = makeStyles((theme) => ({
  root: {
    margin: theme.spacing(0.5, 0),

    '& .date': {
      color: theme.palette.text.secondary,
    },
  },

  'level-error': {
    '& .message': {
      fontWeight: 'bold',
      color: theme.palette.error.main,
    },
  },

  'level-warning': {
    '& .message': {
      fontWeight: 'bold',
      color: theme.palette.warning.main,
    },
  },

  'level-info': {},
}));

type MarkerProps = {
  date?: Date;
  level?: 'error' | 'info' | 'warning';
  message?: string;
};

/**
 * Stateless React component showing a marker line in a chat session.
 */
export const Marker = ({ date, level = 'info', message = '' }: MarkerProps) => {
  const classes = useStyles();
  const className = clsx(classes.root, classes[`level-${level}`]);
  const dateComponent = date && (
    <span className='date'>
      <TimeAgo date={date} />
    </span>
  );
  return (
    <div className={className}>
      <span className='message'>{message}</span> {dateComponent}
    </div>
  );
};

export default Marker;

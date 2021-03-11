/**
 * @file React component showing a marker line in a chat session.
 */

import clsx from 'clsx';
import PropTypes from 'prop-types';
import React from 'react';
import TimeAgo from 'react-timeago';

import { makeStyles } from '@material-ui/core/styles';

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
}));

/**
 * Stateless React component showing a marker line in a chat session.
 */
export const Marker = ({ date, level, message }) => {
  const classes = useStyles();
  const className = clsx(
    classes.root,
    classes[`level-${level}`] || classes['level-info']
  );
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

Marker.propTypes = {
  level: PropTypes.string,
  message: PropTypes.string,
  date: PropTypes.instanceOf(Date),
};

Marker.defaultProps = {
  level: 'info',
  message: '',
};

export default Marker;

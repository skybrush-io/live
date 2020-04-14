/**
 * @file React component showing a separator line in a chat session.
 */

import PropTypes from 'prop-types';
import React from 'react';

import { makeStyles } from '@material-ui/core/styles';

const lineStyle = (theme) => ({
  content: '’’',
  position: 'absolute',
  top: '50%',
  width: 9999,
  height: 1,
  background: theme.palette.text.hint,
});

const useStyles = makeStyles((theme) => ({
  root: {
    display: 'block',
    textAlign: 'center',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    color: theme.palette.text.hint,

    '& > span': {
      position: 'relative',
      display: 'inline-block',
      textTransform: 'uppercase',
      fontSize: 'smaller',
    },

    '& > span:before': {
      right: '100%',
      marginRight: theme.spacing(0.5),
      ...lineStyle(theme),
    },

    '& > span:after': {
      left: '100%',
      marginLeft: theme.spacing(0.5),
      ...lineStyle(theme),
    },
  },

  separator: {
    backgroundColor: theme.palette.text.hint,
    border: 'none',
    height: 2,
  },
}));

const Separator = ({ message }) => {
  const classes = useStyles();
  return message ? (
    <div className={classes.root}>
      <span>{message}</span>
    </div>
  ) : (
    <hr className={classes.separator} />
  );
};

Separator.propTypes = {
  message: PropTypes.string,
};

export default Separator;

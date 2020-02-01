/**
 * @file React component showing a single chat bubble in a chat session.
 */

import clsx from 'clsx';
import PropTypes from 'prop-types';
import React from 'react';
import TimeAgo from 'react-time-ago';

import { blue, grey } from '@material-ui/core/colors';
import { makeStyles } from '@material-ui/core/styles';

import { isDark } from '~/theme';

const useStyles = makeStyles(
  theme => ({
    root: {
      margin: theme.spacing(0.5, 0),
      display: 'flex',
      alignItems: 'flex-start',
      width: '100%'
    },

    bubble: {
      position: 'relative',
      borderRadius: 5,
      padding: theme.spacing(0.5, 1),
      margin: theme.spacing(0.5, 0),
      minHeight: theme.spacing(1),
      overflowX: 'auto',
      '& pre': {
        margin: theme.spacing(0.5)
      }
    },

    ownBubble: {
      background: isDark(theme) ? blue[400] : blue[600],
      color: theme.palette.getContrastText(
        isDark(theme) ? blue[400] : blue[600]
      )
    },

    otherBubble: {
      background: isDark(theme) ? grey[900] : grey[100],
      color: theme.palette.getContrastText(
        isDark(theme) ? grey[900] : grey[100]
      ),

      '& .chat-meta': {
        textAlign: 'right'
      }
    },

    meta: {
      fontSize: 'smaller',
      textAlign: 'left',

      '& .author': {
        fontWeight: 'bold',
        color: theme.palette.text.secondary
      },

      '& .date': {
        color: theme.palette.text.hint
      }
    }
  }),
  { name: 'ChatBubble' }
);

/**
 * Stateless React component showing a single chat bubble in a chat
 * session.
 */
const ChatBubble = ({
  author,
  body,
  date,
  leftComponent,
  own,
  raw,
  rightComponent
}) => {
  const classes = useStyles();
  const dateComponent = date && (
    <span className="date">
      <TimeAgo date={date} />
    </span>
  );
  const leftComponentWrapper = leftComponent && (
    <div style={{ flex: 0 }}>{leftComponent}</div>
  );
  const rightComponentWrapper = rightComponent && (
    <div style={{ flex: 0 }}>{rightComponent}</div>
  );
  const bubbleClasses = clsx(
    classes.bubble,
    own ? classes.ownBubble : classes.otherBubble
  );
  const bubble = raw ? (
    // eslint-disable-next-line react/no-danger
    <div className={bubbleClasses} dangerouslySetInnerHTML={{ __html: body }} />
  ) : (
    <div className={bubbleClasses}>{body}</div>
  );
  return (
    <div className={clsx(classes.root, own ? classes.own : classes.other)}>
      {leftComponentWrapper}
      <div style={{ flex: 1, maxWidth: '100%' }}>
        <div className={classes.meta}>
          <span className="author">{author}</span> {dateComponent}
        </div>
        {bubble}
      </div>
      {rightComponentWrapper}
    </div>
  );
};

ChatBubble.propTypes = {
  author: PropTypes.string,
  body: PropTypes.string,
  date: PropTypes.number,
  own: PropTypes.bool,
  raw: PropTypes.bool,
  leftComponent: PropTypes.oneOfType([
    PropTypes.node,
    PropTypes.arrayOf(PropTypes.node)
  ]),
  rightComponent: PropTypes.oneOfType([
    PropTypes.node,
    PropTypes.arrayOf(PropTypes.node)
  ])
};

ChatBubble.defaultProps = {
  author: 'Anonymous',
  body: '',
  own: true,
  raw: false
};

export default ChatBubble;

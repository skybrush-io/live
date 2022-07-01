/**
 * @file React component showing a single chat bubble in a chat session.
 */

import clsx from 'clsx';
import { Markup } from 'interweave';
import PropTypes from 'prop-types';
import React from 'react';

import { blue, grey } from '@material-ui/core/colors';
import { makeStyles } from '@material-ui/core/styles';

import { isThemeDark } from '@skybrush/app-theme-material-ui';

import { colorForSeverity } from '~/components/colors';
import { Severity } from '~/model/enums';
import CustomPropTypes from '~/utils/prop-types';

const useStyles = makeStyles(
  (theme) => ({
    root: {
      margin: theme.spacing(0.25, 0, 0, 0),
      display: 'flex',
      alignItems: 'flex-start',
      width: '100%',
    },

    bubble: {
      position: 'relative',
      borderRadius: 5,
      padding: theme.spacing(0.5, 1),
      margin: theme.spacing(0.25, 0, 0, 0),
      minHeight: theme.spacing(1),
      overflowX: 'auto',
      '& pre': {
        margin: theme.spacing(0.5),
      },
    },

    ownBubble: {
      background: isThemeDark(theme) ? blue[400] : blue[600],
      color: theme.palette.getContrastText(
        isThemeDark(theme) ? blue[400] : blue[600]
      ),
    },

    otherBubble: {
      background: isThemeDark(theme) ? grey[900] : grey[100],
      color: theme.palette.getContrastText(
        isThemeDark(theme) ? grey[900] : grey[100]
      ),

      '& .chat-meta': {
        textAlign: 'right',
      },

      '&.severity-critical': {
        borderLeft: `3px solid ${colorForSeverity(Severity.CRITICAL)}`,
      },

      '&.severity-debug': {
        borderLeft: `3px solid ${colorForSeverity(Severity.DEBUG)}`,
      },

      '&.severity-error': {
        borderLeft: `3px solid ${colorForSeverity(Severity.ERROR)}`,
      },

      '&.severity-info': {
        borderLeft: `3px solid ${colorForSeverity(Severity.INFO)}`,
      },

      '&.severity-warning': {
        borderLeft: `3px solid ${colorForSeverity(Severity.WARNING)}`,
      },
    },

    meta: {
      fontSize: 'smaller',
      margin: theme.spacing(0.5, 0, 0, 0),
      textAlign: 'left',

      '& .author': {
        fontWeight: 'bold',
        color: theme.palette.text.secondary,
      },

      '& .date': {
        color: theme.palette.text.hint,
        float: 'right',
      },
    },
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
  rightComponent,
  severity,
  showMeta,
}) => {
  const classes = useStyles();
  const dateComponent = date && showMeta && (
    <span className='date'>{date}</span>
  );
  const leftComponentWrapper = leftComponent && (
    <div style={{ flex: 0 }}>{leftComponent}</div>
  );
  const rightComponentWrapper = rightComponent && (
    <div style={{ flex: 0 }}>{rightComponent}</div>
  );
  const bubbleClasses = clsx(
    classes.bubble,
    own ? classes.ownBubble : classes.otherBubble,
    severity && `severity-${severity}`
  );
  const bubble = (
    <div className={bubbleClasses}>
      {raw ? <Markup content={body} /> : body}
    </div>
  );
  return (
    <div className={clsx(classes.root, own ? classes.own : classes.other)}>
      {leftComponentWrapper}
      <div style={{ flex: 1, maxWidth: '100%' }}>
        {showMeta && (
          <div className={classes.meta}>
            <span className='author'>{author}</span> {dateComponent}
          </div>
        )}
        {bubble}
      </div>
      {rightComponentWrapper}
    </div>
  );
};

ChatBubble.propTypes = {
  author: PropTypes.string,
  body: PropTypes.string,
  date: PropTypes.string,
  own: PropTypes.bool,
  raw: PropTypes.bool,
  leftComponent: PropTypes.oneOfType([
    PropTypes.node,
    PropTypes.arrayOf(PropTypes.node),
  ]),
  rightComponent: PropTypes.oneOfType([
    PropTypes.node,
    PropTypes.arrayOf(PropTypes.node),
  ]),
  severity: CustomPropTypes.severity,
  showMeta: PropTypes.bool,
};

ChatBubble.defaultProps = {
  author: 'Anonymous',
  body: '',
  own: true,
};

export default ChatBubble;

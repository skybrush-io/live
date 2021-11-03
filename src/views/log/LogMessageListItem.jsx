import format from 'date-fns/format';
import PropTypes from 'prop-types';
import React from 'react';

import { makeStyles } from '@material-ui/core/styles';

import { LogLevel } from '~/utils/logging';

import { Status } from '@skybrush/app-theme-material-ui';
import StatusLight from '@skybrush/mui-components/lib/StatusLight';

const statusMap = {
  [LogLevel.DEBUG]: Status.DEBUG,
  [LogLevel.INFO]: null,
  [LogLevel.WARNING]: Status.WARNING,
  [LogLevel.ERROR]: Status.ERROR,
  [LogLevel.FATAL]: Status.FATAL,
};

function statusForLogLevel(level) {
  if (level <= LogLevel.DEBUG) {
    return statusMap[LogLevel.DEBUG];
  }

  if (level <= LogLevel.INFO) {
    return statusMap[LogLevel.INFO];
  }

  if (level <= LogLevel.WARNING) {
    return statusMap[LogLevel.WARNING];
  }

  if (level <= LogLevel.ERROR) {
    return statusMap[LogLevel.ERROR];
  }

  if (level <= LogLevel.FATAL) {
    return statusMap[LogLevel.FATAL];
  }

  return Status.OFF;
}

function statusForLogItem(item) {
  return item.semantics === 'success'
    ? Status.SUCCESS
    : statusForLogLevel(item.level);
}

const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
    padding: theme.spacing(0, 1),
    alignItems: 'stretch',
    borderBottom: `1px solid ${theme.palette.divider}`,
    cursor: 'default',

    '&:hover': {
      backgroundColor: theme.palette.action.hover,
    },
  },

  statusLight: {
    paddingTop: 2,
    width: 20,
  },

  timestamp: {
    color: theme.palette.text.secondary,
    paddingRight: theme.spacing(1),
    width: 56,
    textAlign: 'right',
  },

  module: {
    color: theme.palette.primary[500],
    overflow: 'hidden',
    paddingRight: theme.spacing(1),
    textOverflow: 'ellipsis',
    width: 96,
  },

  auxiliaryId: {
    color: theme.palette.text.secondary,
    overflow: 'hidden',
    paddingRight: theme.spacing(1),
    textOverflow: 'ellipsis',
    width: 80,
  },

  moduleExtended: {
    color: theme.palette.primary[500],
    overflow: 'hidden',
    paddingRight: theme.spacing(1),
    textOverflow: 'ellipsis',
    width: 96 + 80,
  },

  message: {
    flex: 1,
    overflow: 'hidden',
    whiteSpace: 'noWrap',
  },
}));

const LogMessageListItem = React.memo(({ item }) => {
  const status = statusForLogItem(item);
  const classes = useStyles();

  let formattedTimestamp;

  try {
    formattedTimestamp = format(item.timestamp, 'H:mm:ss');
  } catch {
    formattedTimestamp = '??:??:??';
  }

  return (
    <div className={classes.root}>
      <div className={classes.statusLight}>
        {status && <StatusLight inline status={statusForLogItem(item)} />}
      </div>
      <div className={classes.timestamp}>{formattedTimestamp}</div>
      {item.auxiliaryId ? (
        <>
          <div className={classes.module}>{item.module}</div>
          <div className={classes.auxiliaryId}>{item.auxiliaryId}</div>
        </>
      ) : (
        <div className={classes.moduleExtended}>{item.module}</div>
      )}
      <div className={classes.message}>{item.message}</div>
    </div>
  );
});

LogMessageListItem.propTypes = {
  item: PropTypes.shape({
    level: PropTypes.number,
    message: PropTypes.string,
    module: PropTypes.string,
    timestamp: PropTypes.number,
    auxiliaryId: PropTypes.string,
  }),
};

export default LogMessageListItem;

/**
 * @file React component that scans the system path and tries to find an
 * executable on the path. Provides feedback to the user about the state of
 * the scan.
 */

import CircularProgress from '@material-ui/core/CircularProgress';
import { green, red, yellow } from '@material-ui/core/colors';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import { makeStyles } from '@material-ui/core/styles';
import Clear from '@material-ui/icons/Clear';
import Done from '@material-ui/icons/Done';
import Warning from '@material-ui/icons/Warning';

import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import { startLocalServerExecutableSearch } from '~/features/local-server/slice';

const icons = {
  found: (
    <ListItemIcon style={{ color: green[500], margin: '0 0 0 19px' }}>
      <Done />
    </ListItemIcon>
  ),
  notFound: (
    <ListItemIcon style={{ color: yellow[700], margin: '0 0 0 19px' }}>
      <Warning />
    </ListItemIcon>
  ),
  scanning: (
    <ListItemIcon style={{ margin: '0 0 0 19px' }}>
      <CircularProgress variant="indeterminate" color="secondary" size={32} />
    </ListItemIcon>
  ),
  error: (
    <ListItemIcon style={{ color: red[500], margin: '0 0 0 19px' }}>
      <Clear />
    </ListItemIcon>
  )
};

const useStyles = makeStyles(theme => ({
  root: {
    backgroundColor:
      theme.palette.type === 'dark'
        ? theme.palette.grey.A400
        : theme.palette.grey[200],
    paddingTop: 6
  }
}));

const PathScannerPresentation = ({
  error,
  notFoundMessage,
  onRequestReload,
  result,
  scanning,
  scanningMessage,
  successMessage
}) => {
  const classes = useStyles();
  return (
    <ListItem button divider className={classes.root} onClick={onRequestReload}>
      <ListItemIcon>
        {scanning
          ? icons.scanning
          : error
          ? icons.error
          : result
          ? icons.found
          : icons.notFound}
      </ListItemIcon>
      <ListItemText
        primary={
          error ||
          (result
            ? successMessage
            : scanning
            ? scanningMessage
            : notFoundMessage)
        }
        secondary={
          scanning ? 'Looking for server' : result || 'Click to scan again'
        }
      />
    </ListItem>
  );
};

PathScannerPresentation.propTypes = {
  error: PropTypes.string,
  notFoundMessage: PropTypes.string,
  onRequestReload: PropTypes.func,
  result: PropTypes.string,
  scanning: PropTypes.bool,
  scanningMessage: PropTypes.string,
  successMessage: PropTypes.string
};

PathScannerPresentation.defaultProps = {
  notFoundMessage: 'Server executable not found.',
  scanningMessage: 'Please wait...',
  successMessage: 'Server executable found successfully.'
};

export default connect(
  // mapStateToProps
  state => ({
    ...state.localServer.pathScan
  }),
  // mapDispatchToProps
  dispatch => ({
    onRequestReload: () => {
      dispatch(startLocalServerExecutableSearch());
    }
  })
)(PathScannerPresentation);

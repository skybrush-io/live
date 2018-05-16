/**
 * @file React component that scans the system path and tries to find an
 * executable on the path. Provides feedback to the user about the state of
 * the scan.
 */

import { ListItem, ListItemIcon, ListItemText } from 'material-ui/List'
import { CircularProgress } from 'material-ui/Progress'
import { green, grey, red, yellow } from 'material-ui/colors'
import Clear from 'material-ui-icons/Clear'
import Done from 'material-ui-icons/Done'
import Warning from 'material-ui-icons/Warning'

import PropTypes from 'prop-types'
import React from 'react'
import { connect } from 'react-redux'

import { startLocalServerExecutableSearch } from '../../../actions/local-server'

const icons = {
  found: (
    <ListItemIcon style={{ color: green[500], margin: '0 19px' }}>
      <Done />
    </ListItemIcon>
  ),
  notFound: (
    <ListItemIcon style={{ color: yellow[700], margin: '0 19px' }}>
      <Warning />
    </ListItemIcon>
  ),
  scanning: (
    <ListItemIcon style={{ margin: '0 11px' }}>
      <CircularProgress variant='indeterminate' color='secondary' />
    </ListItemIcon>
  ),
  error: (
    <ListItemIcon style={{ color: red[500], margin: '0 19px' }}>
      <Clear />
    </ListItemIcon>
  )
}

const PathScannerPresentation = ({
  error, notFoundMessage, onRequestReload, result,
  scanning, scanningMessage, successMessage
}) => (
  <ListItem
    button divider
    style={{ backgroundColor: grey[200], paddingTop: 12 }}
    onClick={onRequestReload}
  >
    {scanning ? icons.scanning : (error ? icons.error : (result ? icons.found : icons.notFound))}
    <ListItemText
      primary={error || (result ? successMessage : (scanning ? scanningMessage : notFoundMessage))}
      secondary={scanning ? 'Looking for server' : (result || 'Click to scan again')} />
  </ListItem>
)

PathScannerPresentation.propTypes = {
  error: PropTypes.string,
  notFoundMessage: PropTypes.string,
  onRequestReload: PropTypes.func,
  result: PropTypes.string,
  scanning: PropTypes.bool,
  scanningMessage: PropTypes.string,
  successMessage: PropTypes.string
}

PathScannerPresentation.defaultProps = {
  notFoundMessage: 'Server executable not found.',
  scanningMessage: 'Please wait...',
  successMessage: 'Server executable found successfully.'
}

export default connect(
  // mapStateToProps
  state => ({
    ...state.localServer.pathScan
  }),
  // mapDispatchToProps
  dispatch => ({
    onRequestReload: () => {
      dispatch(startLocalServerExecutableSearch())
    }
  })
)(PathScannerPresentation)

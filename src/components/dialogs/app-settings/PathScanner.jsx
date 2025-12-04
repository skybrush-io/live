/**
 * @file React component that scans the system path and tries to find an
 * executable on the path. Provides feedback to the user about the state of
 * the scan.
 */

import ListItemText from '@mui/material/ListItemText';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import DialogHeaderListItem, {
  ICON_PRESETS,
} from '~/components/DialogHeaderListItem';
import { startLocalServerExecutableSearch } from '~/features/local-server/slice';

const PathScannerPresentation = ({
  error,
  notFoundMessage = 'Server executable not found.',
  onRequestReload,
  result,
  scanning,
  scanningMessage = 'Please wait…',
  successMessage = 'Server executable found successfully.',
}) => (
  <DialogHeaderListItem button onClick={onRequestReload}>
    {scanning
      ? ICON_PRESETS.inProgress
      : error
        ? ICON_PRESETS.error
        : result
          ? ICON_PRESETS.success
          : ICON_PRESETS.warning}
    <ListItemText
      primary={
        error ||
        (result ? successMessage : scanning ? scanningMessage : notFoundMessage)
      }
      secondary={
        scanning ? 'Looking for server' : result || 'Click to scan again'
      }
    />
  </DialogHeaderListItem>
);

PathScannerPresentation.propTypes = {
  error: PropTypes.string,
  notFoundMessage: PropTypes.string,
  onRequestReload: PropTypes.func,
  result: PropTypes.string,
  scanning: PropTypes.bool,
  scanningMessage: PropTypes.string,
  successMessage: PropTypes.string,
};

export default connect(
  // mapStateToProps
  (state) => ({
    ...state.localServer.pathScan,
  }),
  // mapDispatchToProps
  {
    onRequestReload: startLocalServerExecutableSearch,
  }
)(PathScannerPresentation);

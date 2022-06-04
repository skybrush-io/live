import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import DialogActions from '@material-ui/core/DialogActions';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import Switch from '@material-ui/core/Switch';

import DialogHeaderListItem, {
  ICON_PRESETS,
} from '~/components/DialogHeaderListItem';
import { isConnected, supportsMapCaching } from '~/features/servers/selectors';

import { isMapCachingEnabled } from './selectors';
import { setMapCachingEnabled } from './slice';

const MapCachingPanel = ({
  onClearCache,
  onClose,
  isConnected,
  isMapCachingEnabled,
  isMapCachingSupported,
  setMapCachingEnabled,
}) => {
  return (
    <>
      <DialogHeaderListItem>
        {isMapCachingSupported ? ICON_PRESETS.success : ICON_PRESETS.warning}
        <ListItemText
          primary={
            isMapCachingSupported
              ? 'Server supports offline map caching'
              : isConnected
              ? 'Server does not support offline map caching'
              : 'Connect to a server with offline map support'
          }
        />
      </DialogHeaderListItem>
      <ListItem
        button
        disableRipple
        onClick={() => setMapCachingEnabled(!isMapCachingEnabled)}
      >
        <ListItemIcon style={{ margin: '0 17px 0 2px' }}>
          <Switch checked={isMapCachingEnabled} />
        </ListItemIcon>
        <ListItemText primary='Use cached map tiles from server' />
      </ListItem>
      <DialogActions>
        <Button
          disabled={!isMapCachingSupported || !onClearCache}
          onClick={onClearCache}
        >
          Clear cache
        </Button>
        <Box flex={1} />
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </>
  );
};

MapCachingPanel.propTypes = {
  isConnected: PropTypes.bool,
  isMapCachingEnabled: PropTypes.bool,
  isMapCachingSupported: PropTypes.bool,
  setMapCachingEnabled: PropTypes.func,
  onClearCache: PropTypes.func,
  onClose: PropTypes.func,
};

export default connect(
  // mapStateToProps
  (state) => ({
    isConnected: isConnected(state),
    isMapCachingEnabled: isMapCachingEnabled(state),
    isMapCachingSupported: supportsMapCaching(state),
  }),
  // mapDispatchToProps
  {
    setMapCachingEnabled,
  }
)(MapCachingPanel);

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import DialogActions from '@mui/material/DialogActions';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Switch from '@mui/material/Switch';
import PropTypes from 'prop-types';
import React from 'react';
import { withTranslation } from 'react-i18next';
import { connect } from 'react-redux';

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
  t,
}) => {
  return (
    <>
      <DialogHeaderListItem>
        {isMapCachingSupported ? ICON_PRESETS.success : ICON_PRESETS.warning}
        <ListItemText
          primary={
            isMapCachingSupported
              ? t('mapCachingPanel.serverSupport')
              : isConnected
                ? t('mapCachingPanel.serverNotSupport')
                : t('mapCachingPanel.connectToServer')
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
        <ListItemText primary={t('mapCachingPanel.useCachedMapTiles')} />
      </ListItem>
      <DialogActions>
        <Button
          disabled={!isMapCachingSupported || !onClearCache}
          onClick={onClearCache}
        >
          {t('mapCachingPanel.clearChache')}
        </Button>
        <Box flex={1} />
        <Button onClick={onClose}>{t('general.action.close')}</Button>
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
  t: PropTypes.func,
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
)(withTranslation()(MapCachingPanel));

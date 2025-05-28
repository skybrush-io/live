import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Switch from '@mui/material/Switch';
import PropTypes from 'prop-types';
import React from 'react';
import { withTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import { toggleLightControlActive } from '~/features/light-control/actions';
import { isLightControlActive } from '~/features/light-control/selectors';
import { isConnected } from '~/features/servers/selectors';

/**
 * Component that explains to the user how the drones will start after the
 * authorization has been given.
 */
const LightControlMainSwitch = ({ active, connected, onToggle, t }) => (
  <ListItem
    button
    disabled={!connected}
    onClick={connected ? onToggle : undefined}
  >
    <Switch checked={active && connected} />
    <ListItemText
      primary={
        connected
          ? active
            ? t('lightControl.fromGCS')
            : t('lightControl.notFromGCS')
          : t('lightControl.notConnected')
      }
      secondary={
        connected
          ? active
            ? t('lightControl.restoreDefault')
            : t('lightControl.takeControl')
          : t('lightControl.connectToAServer')
      }
    />
  </ListItem>
);

LightControlMainSwitch.propTypes = {
  active: PropTypes.bool,
  connected: PropTypes.bool,
  onToggle: PropTypes.func,
  t: PropTypes.func,
};

export default connect(
  // mapStateToProps
  (state) => ({
    active: isLightControlActive(state),
    connected: isConnected(state),
  }),
  // mapDispatchToProps
  {
    onToggle: toggleLightControlActive,
  }
)(withTranslation()(LightControlMainSwitch));

import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import Switch from '@material-ui/core/Switch';

import { isLightControlActive } from '~/features/light-control/selectors';
import { toggleLightControlActive } from '~/features/light-control/slice';

/**
 * Component that explains to the user how the drones will start after the
 * authorization has been given.
 */
const LightControlMainSwitch = ({ active, onToggle }) => (
  <ListItem button onClick={onToggle}>
    <Switch checked={active} />
    <ListItemText
      primary={
        active ? 'Lights controlled from GCS' : 'Lights not controlled from GCS'
      }
      secondary={
        active
          ? 'Click to restore default light program'
          : 'Click to take control'
      }
    />
  </ListItem>
);

LightControlMainSwitch.propTypes = {
  active: PropTypes.bool,
  onToggle: PropTypes.func,
};

export default connect(
  // mapStateToProps
  (state) => ({
    active: isLightControlActive(state),
  }),
  // mapDispatchToProps
  {
    onToggle: toggleLightControlActive,
  }
)(LightControlMainSwitch);

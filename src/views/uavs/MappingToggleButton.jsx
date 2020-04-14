import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import Mapping from '@material-ui/icons/LooksOne';

import ToggleButton from '~/components/ToggleButton';
import { isShowingMissionIds } from '~/features/settings/selectors';
import { toggleMissionIds } from '~/features/settings/slice';

/**
 * Toggle button that indicates whether we are primarily showing UAV IDs or
 * mission IDs in the application.
 */
const MappingToggleButton = ({ selected, onChange }) => (
  <ToggleButton
    size='small'
    value='missionIds'
    selected={selected}
    onChange={onChange}
  >
    <Mapping />
  </ToggleButton>
);

MappingToggleButton.propTypes = {
  selected: PropTypes.bool,
  onChange: PropTypes.func,
};

export default connect(
  // mapStateToProps
  (state) => ({
    selected: isShowingMissionIds(state),
  }),
  // mapDispatchToProps
  {
    onChange: toggleMissionIds,
  }
)(MappingToggleButton);

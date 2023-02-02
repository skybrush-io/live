import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import Autocomplete from '@material-ui/lab/Autocomplete';
import Box from '@material-ui/core/Box';
import SelectAll from '@material-ui/icons/SelectAll';
import TextField from '@material-ui/core/TextField';

import { TooltipWithContainerFromContext as Tooltip } from '~/containerContext';

import ToggleButton from '~/components/ToggleButton';
import {
  getFollowMapSelectionInUAVDetailsPanel,
  getSelectedUAVIdInUAVDetailsPanel,
  getUAVIdList,
} from '~/features/uavs/selectors';
import {
  setSelectedUAVIdInUAVDetailsPanel,
  toggleFollowMapSelectionInUAVDetailsPanel,
} from '~/features/uavs/slice';

/**
 * Components for selecting the active UAV in the panel from a dropdown or by
 * following the selection on the map.
 */
const UAVDetailsPanelUAVIdSelector = ({
  followMapSelection,
  selectedUAVId,
  setSelectedUAVId,
  toggleFollowMapSelection,
  uavIds,
}) => (
  <Box display='flex'>
    <Autocomplete
      autoHighlight
      disableClearable
      options={uavIds}
      renderInput={(params) => (
        <TextField {...params} size='small' label='UAV ID' />
      )}
      style={{ width: 96 }}
      // Prevent `undefined` from being passed and making the input uncontrolled
      value={selectedUAVId || null}
      onChange={setSelectedUAVId}
    />
    <Tooltip content='Follow the selection on the map'>
      <ToggleButton
        value='followMapSelection'
        selected={followMapSelection}
        onChange={toggleFollowMapSelection}
      >
        <SelectAll />
      </ToggleButton>
    </Tooltip>
  </Box>
);

UAVDetailsPanelUAVIdSelector.propTypes = {
  followMapSelection: PropTypes.bool,
  selectedUAVId: PropTypes.string,
  setSelectedUAVId: PropTypes.func,
  toggleFollowMapSelection: PropTypes.func,
  uavIds: PropTypes.arrayOf(PropTypes.string),
};

export default connect(
  // mapStateToProps
  (state) => ({
    followMapSelection: getFollowMapSelectionInUAVDetailsPanel(state),
    selectedUAVId: getSelectedUAVIdInUAVDetailsPanel(state),
    uavIds: getUAVIdList(state),
  }),
  // mapDispatchToProps
  {
    setSelectedUAVId: (_event, value) =>
      setSelectedUAVIdInUAVDetailsPanel(value),
    toggleFollowMapSelection: toggleFollowMapSelectionInUAVDetailsPanel,
  }
)(UAVDetailsPanelUAVIdSelector);

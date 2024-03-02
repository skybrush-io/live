import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import Box from '@material-ui/core/Box';
import SelectAll from '@material-ui/icons/SelectAll';

import { TooltipWithContainerFromContext as Tooltip } from '~/containerContext';

import ToggleButton from '~/components/ToggleButton';
import DroneAvatar from '~/components/uavs/DroneAvatar';
import { UAVSelectorWrapper } from '~/components/uavs/UAVSelector';
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
}) => (
  <Box display='flex' alignItems='center' mx={0.5}>
    <UAVSelectorWrapper sortedByError onSelect={setSelectedUAVId}>
      {(handleClick) => (
        // NOTE: `DroneAvatar` renders a fragment, so we wrap it with a `div`
        <div>
          <DroneAvatar
            variant='minimal'
            id={selectedUAVId}
            AvatarProps={{ onClick: handleClick, style: { cursor: 'pointer' } }}
          />
        </div>
      )}
    </UAVSelectorWrapper>
    <Tooltip content='Follow the selection on the map'>
      <ToggleButton
        size='small'
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
    setSelectedUAVId: setSelectedUAVIdInUAVDetailsPanel,
    toggleFollowMapSelection: toggleFollowMapSelectionInUAVDetailsPanel,
  }
)(UAVDetailsPanelUAVIdSelector);

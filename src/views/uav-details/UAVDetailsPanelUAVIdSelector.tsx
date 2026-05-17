import SelectAll from '@mui/icons-material/SelectAll';
import Box from '@mui/material/Box';
import { connect } from 'react-redux';

import ToggleButton from '~/components/ToggleButton';
import DroneAvatar from '~/components/uavs/DroneAvatar';
import { UAVSelectorWrapper } from '~/components/uavs/UAVSelector';
import { TooltipWithContainerFromContext as Tooltip } from '~/containerContext';
import {
  getFollowMapSelectionInUAVDetailsPanel,
  getSelectedUAVIdInUAVDetailsPanel,
} from '~/features/uavs/selectors';
import {
  setSelectedUAVIdInUAVDetailsPanel,
  toggleFollowMapSelectionInUAVDetailsPanel,
} from '~/features/uavs/slice';
import type { RootState } from '~/store/reducers';

type UAVDetailsPanelUAVIdSelectorProps = {
  followMapSelection: boolean;
  selectedUAVId?: string;
  setSelectedUAVId: (uavId: string) => void;
  toggleFollowMapSelection: () => void;
};

/**
 * Components for selecting the active UAV in the panel from a dropdown or by
 * following the selection on the map.
 */
const UAVDetailsPanelUAVIdSelector = ({
  followMapSelection,
  selectedUAVId,
  setSelectedUAVId,
  toggleFollowMapSelection,
}: UAVDetailsPanelUAVIdSelectorProps) => (
  <Box sx={{ display: 'flex', alignItems: 'center', mx: 0.5 }}>
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

export default connect(
  // mapStateToProps
  (state: RootState) => ({
    followMapSelection: getFollowMapSelectionInUAVDetailsPanel(state),
    selectedUAVId: getSelectedUAVIdInUAVDetailsPanel(state),
  }),
  // mapDispatchToProps
  {
    setSelectedUAVId: setSelectedUAVIdInUAVDetailsPanel,
    toggleFollowMapSelection: toggleFollowMapSelectionInUAVDetailsPanel,
  }
)(UAVDetailsPanelUAVIdSelector);

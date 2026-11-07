import Box from '@mui/material/Box';
import Toolbar, { type ToolbarProps } from '@mui/material/Toolbar';
import { connect } from 'react-redux';

import UAVOperationsButtonGroup from '~/components/uavs/UAVOperationsButtonGroup';
import { isBroadcast } from '~/features/session/selectors';
import { getSelectedUAVIds } from '~/features/uavs/selectors';
import type { RootState } from '~/store/reducers';

import MappingButtonGroup from './MappingButtonGroup';

type UAVToolbarProps = ToolbarProps &
  Readonly<{
    isBroadcast: boolean;
    selectedUAVIds: string[];
  }>;

/**
 * Main toolbar for controlling the UAVs.
 */
const UAVToolbar = ({
  isBroadcast,
  selectedUAVIds,
  ...rest
}: UAVToolbarProps) => (
  <Toolbar disableGutters variant='dense' {...rest}>
    <Box sx={{ width: '4px' }} />
    <UAVOperationsButtonGroup
      broadcast={isBroadcast}
      selectedUAVIds={selectedUAVIds}
      showColorOverrideBadges
    />
    <Box sx={{ flex: 1 }} />
    <MappingButtonGroup />
  </Toolbar>
);

export default connect(
  // mapStateToProps
  (state: RootState) => ({
    isBroadcast: isBroadcast(state),
    selectedUAVIds: getSelectedUAVIds(state),
  }),
  // mapDispatchToProps
  {},
  null,
  {
    forwardRef: true,
  }
)(UAVToolbar);

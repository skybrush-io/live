import MenuItem from '@mui/material/MenuItem';
import Select, {
  type SelectChangeEvent,
  type SelectProps,
} from '@mui/material/Select';
import capitalize from 'lodash-es/capitalize';
import { connect } from 'react-redux';

import { getSelectedTabInUAVDetailsPanel } from '~/features/uavs/selectors';
import { setSelectedTabInUAVDetailsPanel } from '~/features/uavs/slice';
import type { RootState } from '~/store/reducers';

import {
  isUAVDetailsPanelTab,
  type UAVDetailsPanelTab,
} from '~/features/uavs/types';
import { views } from './UAVDetailsPanelBody';

/**
 * Dropdown menu for selecting a view on the UAV Details Panel.
 */
const UAVDetailsPanelSelect = (props: SelectProps<UAVDetailsPanelTab>) => (
  <Select style={{ width: 128, textAlign: 'center' }} {...props}>
    {Object.keys(views).map((view) => (
      <MenuItem key={view} value={view}>
        {capitalize(view)}
      </MenuItem>
    ))}
  </Select>
);

export default connect(
  // mapStateToProps
  (state: RootState) => ({ value: getSelectedTabInUAVDetailsPanel(state) }),

  // mapDispatchToProps
  {
    onChange: (event: SelectChangeEvent) => {
      const { value } = event.target;
      if (isUAVDetailsPanelTab(value)) {
        setSelectedTabInUAVDetailsPanel(value);
      }
    },
  }
)(UAVDetailsPanelSelect);

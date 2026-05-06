import Tab from '@mui/material/Tab';
import Tabs, { type TabsProps } from '@mui/material/Tabs';
import { connect } from 'react-redux';

import { getSelectedTabInUAVDetailsPanel } from '~/features/uavs/selectors';
import { setSelectedTabInUAVDetailsPanel } from '~/features/uavs/slice';
import { isUAVDetailsPanelTab } from '~/features/uavs/types';
import type { AppDispatch, RootState } from '~/store/reducers';

import { views } from './UAVDetailsPanelBody';

/**
 * Tab list for selecting a view on the UAV Details Panel.
 */
const UAVDetailsPanelTabs = (props: TabsProps) => (
  <Tabs {...props}>
    {Object.keys(views).map((view) => (
      <Tab key={view} label={view} value={view} />
    ))}
  </Tabs>
);

export default connect(
  // mapStateToProps
  (state: RootState) => ({ value: getSelectedTabInUAVDetailsPanel(state) }),

  // mapDispatchToProps
  (dispatch: AppDispatch) => ({
    onChange: (_event: unknown, value: string) => {
      if (isUAVDetailsPanelTab(value)) {
        dispatch(setSelectedTabInUAVDetailsPanel(value));
      }
    },
  })
)(UAVDetailsPanelTabs);

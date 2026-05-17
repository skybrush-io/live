import { connect } from 'react-redux';

import { BackgroundHint } from '@skybrush/mui-components';

import MessagesPanel from '~/components/chat/MessagesPanel';
import PreflightStatusPanel from '~/features/uavs/PreflightStatusPanel';
import {
  getSelectedTabInUAVDetailsPanel,
  getSelectedUAVIdInUAVDetailsPanel,
} from '~/features/uavs/selectors';
import { UAVDetailsPanelTab } from '~/features/uavs/types';
import UAVLogsPanel from '~/features/uavs/UAVLogsPanel';
import UAVTestsPanel from '~/features/uavs/UAVTestsPanel';
import type { RootState } from '~/store/reducers';

export const views: Record<
  UAVDetailsPanelTab,
  React.ComponentType<{ uavId: any }>
> = {
  [UAVDetailsPanelTab.PREFLIGHT]: PreflightStatusPanel,
  [UAVDetailsPanelTab.TESTS]: UAVTestsPanel,
  [UAVDetailsPanelTab.MESSAGES]: MessagesPanel,
  [UAVDetailsPanelTab.LOGS]: UAVLogsPanel,
};

type UABDetailsPanelBodyProps = {
  selectedTab?: UAVDetailsPanelTab;
  uavId?: string | undefined;
};

const UAVDetailsPanelBody = ({
  selectedTab,
  uavId,
}: UABDetailsPanelBodyProps) =>
  !uavId ? (
    <BackgroundHint text='Please select a UAV id!' />
  ) : !selectedTab || !(selectedTab in views) ? (
    <BackgroundHint text='Please select a view!' />
  ) : (
    ((SelectedView) => <SelectedView uavId={uavId} />)(views[selectedTab])
  );

export default connect(
  // mapStateToProps
  (state: RootState) => ({
    selectedTab: getSelectedTabInUAVDetailsPanel(state),
    uavId: getSelectedUAVIdInUAVDetailsPanel(state),
  })
)(UAVDetailsPanelBody);

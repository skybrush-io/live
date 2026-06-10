import { connect } from 'react-redux';

import MessagesPanel from '~/components/chat/MessagesPanel';
import type { RootState } from '~/store/reducers';

import PreflightStatusPanel from './PreflightStatusPanel';
import UAVLogsPanel from './UAVLogsPanel';
import UAVTestsPanel from './UAVTestsPanel';
import {
  getSelectedTabInUAVDetailsDialog,
  getSelectedUAVIdInUAVDetailsDialog,
} from './details';
import { UAVDetailsDialogTab } from './types';

type UAVDetailsDialogBodyProps = {
  selectedTab: UAVDetailsDialogTab;
  uavId?: string;
};

const UAVDetailsDialogBody = ({
  selectedTab,
  uavId,
}: UAVDetailsDialogBodyProps) => {
  switch (selectedTab) {
    case UAVDetailsDialogTab.MESSAGES:
      return <MessagesPanel uavId={uavId} />;

    case UAVDetailsDialogTab.PREFLIGHT:
      return <PreflightStatusPanel uavId={uavId} />;

    case UAVDetailsDialogTab.TESTS:
      return <UAVTestsPanel uavId={uavId} />;

    case UAVDetailsDialogTab.LOGS:
      return <UAVLogsPanel uavId={uavId} />;

    default:
      return null;
  }
};

export default connect(
  // mapStateToProps
  (state: RootState) => ({
    selectedTab: getSelectedTabInUAVDetailsDialog(state),
    uavId: getSelectedUAVIdInUAVDetailsDialog(state),
  })
)(UAVDetailsDialogBody);

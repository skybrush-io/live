import Tab from '@mui/material/Tab';
import { connect } from 'react-redux';

import { DialogTabs, type DialogTabsProps } from '@skybrush/mui-components';

import type { AppDispatch, RootState } from '~/store/reducers';

import {
  getSelectedTabInUAVDetailsDialog,
  setSelectedTabInUAVDetailsDialog,
} from './details';
import { isUAVDetailsDialogTab, UAVDetailsDialogTab } from './types';

type UAVDetailsDialogTabsOwnProps = {
  dragHandleId?: string;
};

type UAVDetailsDialogTabsStateProps = {
  value: UAVDetailsDialogTab;
};

type UAVDetailsDialogTabsDispatchProps = {
  onChange: DialogTabsProps['onChange'];
};

type Props = UAVDetailsDialogTabsOwnProps &
  UAVDetailsDialogTabsStateProps &
  UAVDetailsDialogTabsDispatchProps;

/**
 * Presentation component for the dialog that allows the user to inspect the
 * details of a specific UAV.
 */
const UAVDetailsDialogTabs = ({
  dragHandleId,
  value = UAVDetailsDialogTab.PREFLIGHT,
  ...rest
}: Props) => (
  <DialogTabs
    alignment='left'
    dragHandle={dragHandleId}
    value={value}
    {...rest}
  >
    <Tab label='Preflight' value={UAVDetailsDialogTab.PREFLIGHT} />
    <Tab label='Tests' value={UAVDetailsDialogTab.TESTS} />
    <Tab label='Messages' value={UAVDetailsDialogTab.MESSAGES} />
    <Tab label='Logs' value={UAVDetailsDialogTab.LOGS} />
  </DialogTabs>
);

const ConnectedUAVDetailsDialogTabs = connect(
  (state: RootState) => ({
    value: getSelectedTabInUAVDetailsDialog(state),
  }),
  (dispatch: AppDispatch) => ({
    onChange: (_event: unknown, value: string) => {
      if (isUAVDetailsDialogTab(value)) {
        dispatch(setSelectedTabInUAVDetailsDialog(value));
      }
    },
  })
)(UAVDetailsDialogTabs);

export default ConnectedUAVDetailsDialogTabs;

import { connect } from 'react-redux';

import { JOB_TYPE as FIRMWARE_UPDATE_JOB_TYPE } from '~/features/firmware-update/constants';
import FirmwareUpdateSupportFetcher from '~/features/firmware-update/FirmwareUpdateSupportFetcher';
import type { RootState } from '~/store/reducers';

import DialogContent from '@mui/material/DialogContent';
import AnotherJobTypeRunningHint from './AnotherJobTypeRunningHint';
import {
  getRunningUploadJobType,
  getSelectedJobTypeInUploadDialog,
  isAnotherJobTypeRunning,
} from './selectors';
import UploadPanel from './UploadPanel';

type Props = {
  isAnotherJobTypeRunning: boolean;
  runningJobType: string | undefined;
  selectedJobType: string;
};

const UploadDialogContent = ({
  isAnotherJobTypeRunning,
  runningJobType,
  selectedJobType,
}: Props) => {
  return (
    <DialogContent>
      {selectedJobType === FIRMWARE_UPDATE_JOB_TYPE && (
        <FirmwareUpdateSupportFetcher />
      )}
      {isAnotherJobTypeRunning ? (
        <AnotherJobTypeRunningHint type={runningJobType!} />
      ) : (
        <UploadPanel jobType={selectedJobType} />
      )}
    </DialogContent>
  );
};

export default connect(
  // mapStateToProps
  (state: RootState) => {
    return {
      isAnotherJobTypeRunning: isAnotherJobTypeRunning(state),
      runningJobType: getRunningUploadJobType(state),
      selectedJobType: getSelectedJobTypeInUploadDialog(state) ?? '',
    };
  },
  // mapDispatchToProps
  {}
)(UploadDialogContent);

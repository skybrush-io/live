import type React from 'react';
import { connect } from 'react-redux';

import { DraggableDialog } from '@skybrush/mui-components';

import type { RootState } from '~/store/reducers';

import { getDialogTitleForJobType } from './jobs';
import RestrictToGlobalSelectionSwitch from './RestrictToGlobalSelectionSwitch';
import { getUploadJobResultPanel } from './result-panels';
import {
  getSelectedJobTypeInUploadDialog,
  getUploadDialogState,
} from './selectors';
import { closeUploadDialog } from './slice';
import UploadDialogBottomArea from './UploadDialogBottomArea';
import UploadDialogContent from './UploadDialogContent';
import UploadDialogTabs from './UploadDialogTabs';

type UploadDialogProps = Readonly<{
  jobType: string;
  onClose: () => void;
  open: boolean;
}>;

const UploadDialog = ({
  onClose,
  open,
  jobType,
}: UploadDialogProps): React.JSX.Element => {
  const hasResults = getUploadJobResultPanel(jobType) !== undefined;
  return (
    <DraggableDialog
      fullWidth
      open={Boolean(open)}
      maxWidth='md'
      title={getDialogTitleForJobType(jobType)}
      toolbarComponent={
        // Show tabs instead of the title when we have a results tab for this job type
        hasResults
          ? (dragHandleId: string) => (
              <UploadDialogTabs alignment='left' dragHandle={dragHandleId} />
            )
          : undefined
      }
      titleComponents={
        // When we have a result component, it is the responsibility of the toolbar to
        // show the "restrict to global selection" switch;
        !hasResults && <RestrictToGlobalSelectionSwitch />
      }
      onClose={onClose}
    >
      <UploadDialogContent />
      <UploadDialogBottomArea />
    </DraggableDialog>
  );
};

export default connect(
  // mapStateToProps
  (state: RootState) => {
    const { open } = getUploadDialogState(state);
    return {
      jobType: getSelectedJobTypeInUploadDialog(state) ?? '',
      open,
    };
  },
  // mapDispatchToProps
  {
    onClose: closeUploadDialog,
  }
)(UploadDialog);

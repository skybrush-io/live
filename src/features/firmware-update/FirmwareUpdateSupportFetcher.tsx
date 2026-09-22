import { useEffect } from 'react';
import { connect } from 'react-redux';
import { useInterval } from 'react-use';

import { getSelectedJobInUploadDialog } from '~/features/upload/selectors';
import type { JobData } from '~/features/upload/types';
import type { AppDispatch, RootState } from '~/store/reducers';
import type { Identifier } from '~/utils/collections';

import { fetchSupportingObjectIdsForTargetId } from './actions';

type StateProps = {
  selectedUploadJob: JobData;
};

type DispatchProps = {
  fetchSupportingObjectIdsForTargetId: (targetId: Identifier) => Promise<void>;
};

type Props = {
  fetchSupportingObjectIdsForTargetIdOfSelectedUploadJob: () => void;
};

/**
 * Component that keeps the list of supporting object ids for the currently
 * selected firmware update target id up-to-date while the upload dialog is
 * open.
 */
const FirmwareUpdateSupportFetcher = ({
  fetchSupportingObjectIdsForTargetIdOfSelectedUploadJob,
}: Props) => {
  useEffect(fetchSupportingObjectIdsForTargetIdOfSelectedUploadJob);
  useInterval(fetchSupportingObjectIdsForTargetIdOfSelectedUploadJob, 5000);
  return null;
};

const ConnectedFirmwareUpdateSupportFetcher = connect(
  // mapStateToProps
  (state: RootState): StateProps => ({
    selectedUploadJob: getSelectedJobInUploadDialog(state),
  }),
  // mapDispatchToProps
  (dispatch: AppDispatch): DispatchProps => ({
    fetchSupportingObjectIdsForTargetId: (targetId) =>
      dispatch(fetchSupportingObjectIdsForTargetId(targetId)),
  }),
  // mergeProps
  (
    { selectedUploadJob }: StateProps,
    { fetchSupportingObjectIdsForTargetId }: DispatchProps
  ): Props => ({
    fetchSupportingObjectIdsForTargetIdOfSelectedUploadJob() {
      const target = (selectedUploadJob.payload as any)?.target;
      if (typeof target === 'string') {
        void fetchSupportingObjectIdsForTargetId(target);
      }
    },
  })
)(FirmwareUpdateSupportFetcher);

export default ConnectedFirmwareUpdateSupportFetcher;

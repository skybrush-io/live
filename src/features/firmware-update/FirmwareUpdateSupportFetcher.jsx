import PropTypes from 'prop-types';
import { useEffect } from 'react';
import { connect } from 'react-redux';
import { useInterval } from 'react-use';

import { getSelectedJobInUploadDialog } from '~/features/upload/selectors';

import { fetchSupportingObjectIdsForTargetId } from './actions';

/**
 * Component that keeps the list of supporting object ids for the currently
 * selected firmware update target id up-to-date while the upload dialog is
 * open.
 */
const FirmwareUpdateSupportFetcher = ({
  fetchSupportingObjectIdsForTargetIdOfSelectedUploadJob,
}) => {
  useEffect(fetchSupportingObjectIdsForTargetIdOfSelectedUploadJob);
  useInterval(fetchSupportingObjectIdsForTargetIdOfSelectedUploadJob, 5000);
  return null;
};

FirmwareUpdateSupportFetcher.propTypes = {
  fetchSupportingObjectIdsForTargetIdOfSelectedUploadJob: PropTypes.func,
};

export default connect(
  // mapStateToProps
  (state) => ({
    selectedUploadJob: getSelectedJobInUploadDialog(state),
  }),
  // mapDispatchToProps
  {
    fetchSupportingObjectIdsForTargetId,
  },
  // mergeProps
  ({ selectedUploadJob }, { fetchSupportingObjectIdsForTargetId }) => ({
    fetchSupportingObjectIdsForTargetIdOfSelectedUploadJob() {
      fetchSupportingObjectIdsForTargetId(selectedUploadJob?.payload?.target);
    },
  })
)(FirmwareUpdateSupportFetcher);

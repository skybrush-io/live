import ListItem from '@mui/material/ListItem';
import PropTypes from 'prop-types';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import StatusLight from '@skybrush/mui-components/lib/StatusLight';

import ListItemTextWithProgress from '~/components/ListItemTextWithProgress';
import { Status } from '~/components/semantics';
import { SHOW_UPLOAD_JOB } from '~/features/show/constants';
import { getSetupStageStatuses } from '~/features/show/stages';
import {
  getUploadProgress,
  isUploadInProgress,
} from '~/features/upload/selectors';
import { openUploadDialogForJob } from '~/features/upload/slice';
import UploadProgressBar from '~/features/upload/UploadProgressBar';

/**
 * React component for the button that allows the user to start or stop the
 * upload process of the current show to the drones.
 */
const ShowUploadDialogButton = ({ loading, status, ...rest }) => {
  const { t } = useTranslation();

  return (
    <ListItem button disabled={status === Status.OFF} {...rest}>
      <StatusLight status={status} />
      <ListItemTextWithProgress
        primary={
          loading ? t('show.uploadShowDataLoading') : t('show.uploadShowData')
        }
        secondary={
          loading ? <UploadProgressBar /> : t('show.uploadShowDataStart')
        }
      />
    </ListItem>
  );
};

ShowUploadDialogButton.propTypes = {
  loading: PropTypes.bool,
  onClick: PropTypes.func,
  status: PropTypes.oneOf(Object.values(Status)),
};

export default connect(
  // mapStateToProps
  (state) => ({
    loading: isUploadInProgress(state),
    progress: getUploadProgress(state),
    status: getSetupStageStatuses(state).uploadShow,
  }),
  // mapDispatchToProps
  {
    onClick: () => openUploadDialogForJob({ job: SHOW_UPLOAD_JOB }),
  }
)(ShowUploadDialogButton);

import ListItem from '@mui/material/ListItem';
import ListItemButton, {
  type ListItemButtonProps,
} from '@mui/material/ListItemButton';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import { StatusLight } from '@skybrush/mui-components';

import ListItemTextWithProgress from '~/components/ListItemTextWithProgress';
import { Status } from '~/components/semantics';
import { JOB_TYPE, SHOW_UPLOAD_JOB } from '~/features/show/constants';
import { getSetupStageStatuses } from '~/features/show/stages';
import {
  getSelectedJobTypeInUploadDialog,
  isUploadInProgress,
} from '~/features/upload/selectors';
import { openUploadDialogForJob } from '~/features/upload/slice';
import UploadProgressBar from '~/features/upload/UploadProgressBar';
import type { RootState } from '~/store/reducers';

type Props = Omit<ListItemButtonProps, 'disabled'> & {
  loading: boolean;
  status: Status;
};

/**
 * React component for the button that allows the user to start or stop the
 * upload process of the current show to the drones.
 */
const ShowUploadDialogButton = ({ loading, status, ...rest }: Props) => {
  const { t } = useTranslation();

  return (
    <ListItem disablePadding>
      <ListItemButton disabled={status === Status.OFF} {...rest}>
        <StatusLight status={status} />
        <ListItemTextWithProgress
          primary={
            loading ? t('show.uploadShowDataLoading') : t('show.uploadShowData')
          }
          secondary={
            loading ? <UploadProgressBar /> : t('show.uploadShowDataStart')
          }
        />
      </ListItemButton>
    </ListItem>
  );
};

export default connect(
  (state: RootState) => ({
    loading:
      getSelectedJobTypeInUploadDialog(state) === JOB_TYPE &&
      isUploadInProgress(state),
    status: getSetupStageStatuses(state).uploadShow,
  }),
  {
    onClick: () => openUploadDialogForJob({ job: SHOW_UPLOAD_JOB }),
  }
)(ShowUploadDialogButton);

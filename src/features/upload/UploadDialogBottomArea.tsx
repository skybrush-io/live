import NavigateBefore from '@mui/icons-material/NavigateBefore';
import DialogActions from '@mui/material/DialogActions';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import type { Theme } from '@mui/material/styles';
import { createSecondaryAreaStyle, makeStyles } from '@skybrush/app-theme-mui';
import { connect } from 'react-redux';

import type { RootState } from '~/store/reducers';

import isNil from 'lodash-es/isNil';
import { closeUploadDialogAndStepBack } from './actions';
import CancelUploadButton from './CancelUploadButton';
import ClearUploadHistoryButton from './ClearUploadHistoryButton';
import HiddenTargetsWarning from './HiddenTargetsWarning';
import {
  getSelectedJobTypeInUploadDialog,
  getSelectedTabInUploadDialog,
  getUploadDialogState,
  isAnotherJobTypeRunning,
  isUploadInProgress,
} from './selectors';
import StartUploadButton from './StartUploadButton';
import type { UploadDialogTab } from './types';
import UploadProgressBar from './UploadProgressBar';
import UploadResultIndicatorBox from './UploadResultIndicatorBox';
import UploadSettings from './UploadSettings';
import UploadStatusLegend from './UploadStatusLegend';

const useStyles = makeStyles((theme: Theme) => ({
  bottomArea: {
    ...createSecondaryAreaStyle(theme, { inset: 'top' }),
    padding: theme.spacing(1, 3, 1, 3),
  },
}));

type Props = {
  canGoBack: boolean;
  hideProgress: boolean;
  jobType: string;
  onStepBack: () => void;
  running: boolean;
  showLastUploadResult: boolean;
  selectedTab: UploadDialogTab;
};

const UploadDialogBottomArea = ({
  canGoBack,
  hideProgress,
  jobType,
  onStepBack,
  running,
  selectedTab,
}: Props) => {
  const classes = useStyles();
  return (
    <Stack className={classes.bottomArea}>
      {hideProgress ? null : (
        <>
          <UploadStatusLegend />
          <UploadProgressBar />
          <UploadSettings />
          <HiddenTargetsWarning />
        </>
      )}
      <DialogActions sx={{ p: 0, mt: 1 }}>
        {canGoBack && onStepBack && (
          <IconButton size='small' edge='start' onClick={onStepBack}>
            <NavigateBefore />
          </IconButton>
        )}
        <UploadResultIndicatorBox jobType={jobType} />
        {!running && <ClearUploadHistoryButton />}
        {selectedTab === 'status' &&
          (running ? <CancelUploadButton /> : <StartUploadButton />)}
      </DialogActions>
    </Stack>
  );
};

export default connect(
  // mapStateToProps
  (state: RootState) => {
    const { backAction, showLastUploadResult } = getUploadDialogState(state);
    return {
      canGoBack: !isNil(backAction),
      hideProgress: isAnotherJobTypeRunning(state),
      jobType: getSelectedJobTypeInUploadDialog(state) ?? '',
      running: isUploadInProgress(state),
      selectedTab: getSelectedTabInUploadDialog(state),
      showLastUploadResult,
    };
  },

  // mapDispatchToProps
  {
    onStepBack: closeUploadDialogAndStepBack,
  }
)(UploadDialogBottomArea);

import Box from '@mui/material/Box';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import type { AppThunk, RootState } from '~/store/reducers';
import {
  shouldFlashLightsOfFailedUploads,
  shouldRetryFailedUploadsAutomatically,
} from './selectors';
import { setFlashFailed, setUploadAutoRetry } from './slice';

type Props = {
  autoRetry: boolean;
  flashFailed: boolean;
  onToggleAutoRetry: () => void;
  onToggleFlashFailed: () => void;
};

const UploadSettings = ({
  autoRetry,
  flashFailed,
  onToggleAutoRetry,
  onToggleFlashFailed,
}: Props) => {
  const { t } = useTranslation();

  return (
    <Box sx={{ mt: 1 }}>
      <FormControlLabel
        control={<Checkbox checked={autoRetry} onChange={onToggleAutoRetry} />}
        label={t('uploadPanel.retryFailedAttempts')}
      />
      <FormControlLabel
        control={
          <Checkbox checked={flashFailed} onChange={onToggleFlashFailed} />
        }
        label={t('uploadPanel.flashLightsWhereFailed')}
      />
    </Box>
  );
};

export default connect(
  // mapStateToProps
  (state: RootState) => ({
    autoRetry: shouldRetryFailedUploadsAutomatically(state),
    flashFailed: shouldFlashLightsOfFailedUploads(state),
  }),

  // mapDispatchToProps
  {
    onToggleAutoRetry: (): AppThunk => (dispatch, getState) => {
      const state = getState();
      const autoRetry = shouldRetryFailedUploadsAutomatically(state);
      dispatch(setUploadAutoRetry(!autoRetry));
    },
    onToggleFlashFailed: (): AppThunk => (dispatch, getState) => {
      const state = getState();
      const flashFailed = shouldFlashLightsOfFailedUploads(state);
      dispatch(setFlashFailed(!flashFailed));
    },
  }
)(UploadSettings);

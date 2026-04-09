import Box from '@mui/material/Box';
import { DraggableDialog } from '@skybrush/mui-components';
import { connect } from 'react-redux';

import type { RootState } from '~/store/reducers';

import { useTranslation } from 'react-i18next';
import OverallRTKStatusLight from './OverallRTKStatusLight';
import RTKCorrectionSourceSelector from './RTKCorrectionSourceSelector';
import RTKMessageStatistics from './RTKMessageStatistics';
import RTKSetupDialogBottomPanel from './RTKSetupDialogBottomPanel';
import RTKStatusUpdater from './RTKStatusUpdater';
import { closeRTKSetupDialog } from './slice';

type Props = {
  open: boolean;
  onClose: () => void;
};

/**
 * Presentation component for the dialog that allows the user to set up and
 * monitor the RTK correction source for the UAVs.
 */
const RTKSetupDialog = ({ onClose, open }: Props) => {
  const { t } = useTranslation();
  return (
    <DraggableDialog
      fullWidth
      open={open}
      maxWidth='sm'
      onClose={onClose}
      title={t('RTKSetupDialog.title')}
      titleComponents={<OverallRTKStatusLight format='short' />}
    >
      <RTKStatusUpdater />
      <Box>
        <Box sx={{ mx: 3, mt: 3 }}>
          <RTKCorrectionSourceSelector />
          <Box
            sx={{
              height: 100,
              my: 2,
              boxSizing: 'content-box',
              overflow: 'auto',
            }}
          >
            <RTKMessageStatistics />
          </Box>
        </Box>
        <RTKSetupDialogBottomPanel />
      </Box>
    </DraggableDialog>
  );
};

export default connect(
  // mapStateToProps
  (state: RootState) => ({
    open: state.rtk.dialog.open,
  }),

  // mapDispatchToProps
  {
    onClose: closeRTKSetupDialog,
  }
)(RTKSetupDialog);

import SwapHoriz from '@mui/icons-material/SwapHoriz';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import FormControlLabel from '@mui/material/FormControlLabel';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import { DraggableDialog } from '@skybrush/mui-components';

import type { RootState } from '~/store/reducers';

import { addCurrentPairToSwapQueue, executeSwapBatch } from './actions';
import { SWAP_DRONES_PREVIEW_AREA_MIN_HEIGHT } from './constants';
import {
  canAddCurrentSwapPairToQueue,
  canExecuteSwapBatch,
  getSwapDroneFieldTexts,
  getSwapPreview,
  getSwapWarningMessageKey,
  isSwapDronesDialogOpen,
  shouldOpenUploadDialogAfterSwap,
} from './selectors';
import {
  closeSwapDronesDialog,
  setOpenUploadAfterSwap,
  setSwapDroneFieldText,
} from './slice';
import SwapDroneField from './SwapDroneField';
import SwapDronesPreview from './SwapDronesPreview';
import SwapDronesQueuePanel from './SwapDronesQueuePanel';
import type { SwapFieldSide, SwapPreviewState } from './utils';

type StateProps = {
  canAdd: boolean;
  canSwap: boolean;
  fieldTexts: Record<SwapFieldSide, string>;
  open: boolean;
  openUploadDialogAfterSwap: boolean;
  preview: SwapPreviewState;
  warningMessageKey: string | null;
};

type DispatchProps = {
  onAdd: () => void;
  onClose: () => void;
  onSetFieldText: (payload: { side: SwapFieldSide; text: string }) => void;
  onSetOpenUploadDialogAfterSwap: (open: boolean) => void;
  onSwap: () => void;
};

type Props = DispatchProps & StateProps;

const SwapDronesDialog = ({
  canAdd,
  canSwap,
  fieldTexts,
  onAdd,
  onClose,
  onSetFieldText,
  onSetOpenUploadDialogAfterSwap,
  onSwap,
  open,
  openUploadDialogAfterSwap,
  preview,
  warningMessageKey,
}: Props) => {
  const { t } = useTranslation();

  return (
    <DraggableDialog
      maxWidth='md'
      open={open}
      sidebarComponents={<SwapDronesQueuePanel />}
      sidebarPlacement='right'
      title={t('swapDronesDialog.title')}
      onClose={onClose}
    >
      <DialogContent>
        <Stack direction='row' spacing={1} alignItems='center'>
          <SwapDroneField
            autoFocus
            side='left'
            value={fieldTexts.left}
            onChange={(text) => {
              onSetFieldText({ side: 'left', text });
            }}
          />
          <SwapHoriz />
          <SwapDroneField
            side='right'
            value={fieldTexts.right}
            onChange={(text) => {
              onSetFieldText({ side: 'right', text });
            }}
          />
          <Button variant='outlined' disabled={!canAdd} onClick={onAdd}>
            {t('swapDronesDialog.action.add')}
          </Button>
        </Stack>

        <Box sx={{ pt: 2, minHeight: SWAP_DRONES_PREVIEW_AREA_MIN_HEIGHT }}>
          {warningMessageKey !== null ? (
            <Alert severity='warning' variant='outlined'>
              {t(warningMessageKey)}
            </Alert>
          ) : preview.kind === 'placeholder' ? (
            <Typography variant='body2' color='text.secondary'>
              {t(preview.messageKey)}
            </Typography>
          ) : preview.kind === 'ready' ? (
            <SwapDronesPreview lines={preview.lines} />
          ) : null}
        </Box>
      </DialogContent>
      <DialogActions>
        <FormControlLabel
          label={t('swapDronesDialog.openUploadAfterSwap')}
          control={
            <Checkbox
              checked={openUploadDialogAfterSwap}
              onChange={(event) => {
                onSetOpenUploadDialogAfterSwap(event.target.checked);
              }}
            />
          }
          sx={{ ml: 1 }}
        />
        <Box sx={{ flex: 1 }} />
        <Button onClick={onClose}>{t('general.action.cancel')}</Button>
        <Button disabled={!canSwap} onClick={onSwap} color='primary'>
          {t('swapDronesDialog.action.swap')}
        </Button>
      </DialogActions>
    </DraggableDialog>
  );
};

export default connect(
  (state: RootState): StateProps => ({
    canAdd: canAddCurrentSwapPairToQueue(state),
    canSwap: canExecuteSwapBatch(state),
    fieldTexts: getSwapDroneFieldTexts(state),
    open: isSwapDronesDialogOpen(state),
    openUploadDialogAfterSwap: shouldOpenUploadDialogAfterSwap(state),
    preview: getSwapPreview(state),
    warningMessageKey: getSwapWarningMessageKey(state),
  }),
  {
    onAdd: addCurrentPairToSwapQueue,
    onClose: closeSwapDronesDialog,
    onSetFieldText: setSwapDroneFieldText,
    onSetOpenUploadDialogAfterSwap: setOpenUploadAfterSwap,
    onSwap: executeSwapBatch,
  }
)(SwapDronesDialog);

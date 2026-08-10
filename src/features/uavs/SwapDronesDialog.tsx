import SwapHoriz from '@mui/icons-material/SwapHoriz';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import Stack from '@mui/material/Stack';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import { DraggableDialog } from '@skybrush/mui-components';

import { isShowAuthorizedToStart } from '~/features/show/selectors';
import { showWarning } from '~/features/snackbar/actions';
import { isUploadInProgress } from '~/features/upload/selectors';
import type { RootState } from '~/store/reducers';

import {
  closeSwapDronesDialog,
  isSwapDronesDialogOpen,
} from './details';
import SwapDroneField from './SwapDroneField';
import SwapDronesPreview from './SwapDronesPreview';
import {
  buildSwapPreview,
  emptySwapSlot,
  type SwapSlotState,
} from './utils';

type StateProps = {
  blocked: boolean;
  open: boolean;
};

type DispatchProps = {
  onClose: () => void;
};

type Props = DispatchProps & StateProps;

const SwapDronesDialog = ({ blocked, onClose, open }: Props) => {
  const { t } = useTranslation();
  const [slot1, setSlot1] = useState<SwapSlotState>(emptySwapSlot);
  const [slot2, setSlot2] = useState<SwapSlotState>(emptySwapSlot);

  useEffect(() => {
    if (open) {
      setSlot1(emptySwapSlot());
      setSlot2(emptySwapSlot());
    }
  }, [open]);

  const preview = useMemo(
    () => buildSwapPreview(slot1.resolved, slot2.resolved, blocked, t),
    [slot1.resolved, slot2.resolved, blocked, t]
  );

  const canSwap = !blocked && preview.kind === 'ready';

  const handleSwap = () => {
    showWarning(t('swapDronesDialog.notImplemented'));
  };

  return (
    <DraggableDialog
      fullWidth
      maxWidth='sm'
      open={open}
      title={t('swapDronesDialog.title')}
      onClose={onClose}
    >
      <DialogContent sx={{ overflow: 'visible' }}>
        <Stack spacing={2} sx={{ pt: 1, overflow: 'visible' }}>
          <Stack direction='row' spacing={1.5} alignItems='stretch'>
            <SwapDroneField side='left' slot={slot1} onSlotChange={setSlot1} />
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                color: 'text.secondary',
                flexShrink: 0,
              }}
            >
              <SwapHoriz />
            </Box>
            <SwapDroneField side='right' slot={slot2} onSlotChange={setSlot2} />
          </Stack>

          {(preview.kind === 'warning' || preview.kind === 'blocked') && (
            <Alert severity='warning' variant='outlined'>
              {preview.message}
            </Alert>
          )}

          {(preview.kind === 'placeholder' || preview.kind === 'ready') && (
            <SwapDronesPreview preview={preview} />
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button color='inherit' onClick={onClose}>
          {t('general.action.cancel')}
        </Button>
        <Button variant='contained' disabled={!canSwap} onClick={handleSwap}>
          {t('swapDronesDialog.action.swap')}
        </Button>
      </DialogActions>
    </DraggableDialog>
  );
};

export default connect(
  (state: RootState): StateProps => ({
    open: isSwapDronesDialogOpen(state),
    blocked: isShowAuthorizedToStart(state) || isUploadInProgress(state),
  }),
  {
    onClose: closeSwapDronesDialog,
  }
)(SwapDronesDialog);

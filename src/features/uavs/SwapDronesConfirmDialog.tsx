import SwapHoriz from '@mui/icons-material/SwapHoriz';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import Typography from '@mui/material/Typography';
import { Fragment } from 'react';
import { useTranslation } from 'react-i18next';

import { DraggableDialog } from '@skybrush/mui-components';

import SwapDroneBadge from './SwapDroneBadge';
import { swapDroneRef, type SwapApplyPair } from './utils';

type SwapDronesConfirmDialogProps = {
  onCancel: () => void;
  onConfirm: () => void;
  open: boolean;
  pairs: SwapApplyPair[];
};

const SwapDronesConfirmDialog = ({
  onCancel,
  onConfirm,
  open,
  pairs,
}: SwapDronesConfirmDialogProps) => {
  const { t } = useTranslation();

  return (
    <DraggableDialog
      fullWidth
      maxWidth='xs'
      open={open}
      title={t('swapDronesDialog.confirm.title')}
      onClose={onCancel}
    >
      <DialogContent>
        <Typography variant='body2' color='text.secondary'>
          {t('swapDronesDialog.confirm.message')}
        </Typography>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'max-content auto max-content',
            gridAutoRows: 'max-content',
            columnGap: 0.5,
            rowGap: 0.75,
            alignContent: 'start',
            alignItems: 'center',
            mt: 1.5,
            width: 'max-content',
          }}
        >
          {pairs.map((pair, index) => (
            <Fragment key={index}>
              <Box sx={{ justifySelf: 'end' }}>
                <SwapDroneBadge side='left' label={swapDroneRef(pair.drone1)} />
              </Box>
              <SwapHoriz
                sx={{
                  fontSize: 16,
                  color: 'text.secondary',
                  justifySelf: 'center',
                }}
              />
              <Box sx={{ justifySelf: 'start' }}>
                <SwapDroneBadge
                  side='right'
                  label={swapDroneRef(pair.drone2)}
                />
              </Box>
            </Fragment>
          ))}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button color='inherit' onClick={onCancel}>
          {t('general.action.cancel')}
        </Button>
        <Button variant='contained' onClick={onConfirm}>
          {t('general.action.confirm')}
        </Button>
      </DialogActions>
    </DraggableDialog>
  );
};

export default SwapDronesConfirmDialog;

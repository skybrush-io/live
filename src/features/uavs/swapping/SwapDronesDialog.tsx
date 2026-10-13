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
import { nanoid } from 'nanoid';
import { useCallback, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import { DraggableDialog } from '@skybrush/mui-components';

import { getReverseMissionMapping } from '~/features/mission/selectors';
import { showSuccess } from '~/features/snackbar/actions';
import type { MissionIndex } from '~/model/missions';
import type { RootState } from '~/store/reducers';
import type { Identifier } from '~/utils/collections';

import { getUAVIdList } from '../selectors';
import { applySwapDronesBatch } from './actions';
import { SWAP_DRONES_PREVIEW_AREA_MIN_HEIGHT } from './constants';
import {
  isSwapDronesDialogOpen,
  isSwappingAllowed,
  shouldOpenUploadDialogAfterSwap,
} from './selectors';
import { closeSwapDronesDialog, setOpenUploadAfterSwap } from './slice';
import SwapDroneField, { type SwapDroneFieldValue } from './SwapDroneField';
import SwapDronesPreview from './SwapDronesPreview';
import SwapDronesQueuePanel from './SwapDronesQueuePanel';
import type { ResolvedDronePair, ResolvedDronePairWithId } from './types';
import {
  buildSwapApplyPairs,
  buildSwapPreview,
  currentPairOverlapsQueue,
  validateSwapBatch,
} from './utils';

const EMPTY_SLOT: SwapDroneFieldValue = Object.freeze({
  filterText: '',
  resolved: null,
});

type StateProps = {
  blocked: boolean;
  onlineUavIds: Identifier[];
  open: boolean;
  openUploadDialogAfterSwap: boolean;
  reverseMissionMapping: Readonly<Record<string, MissionIndex>>;
};

type DispatchProps = {
  onApplySwap: (
    pairs: ResolvedDronePair[],
    options?: { openUploadAfterSwap?: boolean }
  ) => void;
  onClose: () => void;
  onSetOpenUploadDialogAfterSwap: (open: boolean) => void;
};

type Props = DispatchProps & StateProps;

const SwapDronesDialogBody = ({
  blocked,
  onlineUavIds,
  onApplySwap,
  onClose,
  onSetOpenUploadDialogAfterSwap,
  open,
  openUploadDialogAfterSwap,
  reverseMissionMapping,
}: Props) => {
  const { t } = useTranslation();
  const [slot1, setSlot1] = useState<SwapDroneFieldValue>(EMPTY_SLOT);
  const [slot2, setSlot2] = useState<SwapDroneFieldValue>(EMPTY_SLOT);
  const [queue, setQueue] = useState<ResolvedDronePairWithId[]>([]);

  const preview = useMemo(
    () => buildSwapPreview(slot1.resolved, slot2.resolved, blocked, t),
    [slot1.resolved, slot2.resolved, blocked, t]
  );

  const overlapsQueue = useMemo(
    () => currentPairOverlapsQueue(slot1.resolved, slot2.resolved, queue),
    [slot1.resolved, slot2.resolved, queue]
  );

  const batchValidation = useMemo(
    () =>
      validateSwapBatch(
        queue,
        slot1.resolved,
        slot2.resolved,
        blocked,
        onlineUavIds,
        reverseMissionMapping,
        t
      ),
    [
      blocked,
      onlineUavIds,
      queue,
      reverseMissionMapping,
      slot1.resolved,
      slot2.resolved,
      t,
    ]
  );

  const showBatchAlert =
    !batchValidation.valid &&
    batchValidation.reason !== 'empty' &&
    batchValidation.reason !== 'blocked';

  const overlapWarning =
    overlapsQueue && preview.kind === 'ready'
      ? t('swapDronesDialog.queue.overlap')
      : null;

  const batchWarning =
    !overlapWarning && showBatchAlert ? batchValidation.message : null;

  const previewWarning =
    preview.kind === 'warning' || preview.kind === 'blocked'
      ? preview.message
      : null;

  const warningMessage = overlapWarning ?? batchWarning ?? previewWarning;

  const canAdd = !blocked && preview.kind === 'ready' && !overlapsQueue;
  const canSwap = batchValidation.valid && warningMessage === null;

  const handleAdd = () => {
    const drone1 = slot1.resolved;
    const drone2 = slot2.resolved;
    if (!canAdd || !drone1 || !drone2) {
      return;
    }

    setQueue((current) => [
      ...current,
      {
        id: nanoid(),
        drone1,
        drone2,
      },
    ]);
    setSlot1(EMPTY_SLOT);
    setSlot2(EMPTY_SLOT);
  };

  const handleRemoveFromQueue = useCallback((id: string) => {
    setQueue((current) => current.filter((pair) => pair.id !== id));
  }, []);

  const handleSwap = () => {
    if (!batchValidation.valid || warningMessage !== null) {
      return;
    }

    const pairs = buildSwapApplyPairs(
      queue,
      batchValidation.applyCurrentPair,
      slot1.resolved,
      slot2.resolved
    );

    onApplySwap(pairs, { openUploadAfterSwap: openUploadDialogAfterSwap });
    setSlot1(EMPTY_SLOT);
    setSlot2(EMPTY_SLOT);
    setQueue([]);
    showSuccess(t('swapDronesDialog.success'));
    onClose();
  };

  return (
    <DraggableDialog
      maxWidth='md'
      open={open}
      sidebarComponents={
        <SwapDronesQueuePanel queue={queue} onRemove={handleRemoveFromQueue} />
      }
      sidebarPlacement='right'
      title={t('swapDronesDialog.title')}
      onClose={onClose}
    >
      <DialogContent>
        <Stack direction='row' spacing={1} alignItems='center'>
          <SwapDroneField
            autoFocus
            side='left'
            value={slot1}
            onChange={setSlot1}
          />
          <SwapHoriz />
          <SwapDroneField side='right' value={slot2} onChange={setSlot2} />
          <Button variant='outlined' disabled={!canAdd} onClick={handleAdd}>
            {t('swapDronesDialog.action.add')}
          </Button>
        </Stack>

        <Box sx={{ pt: 2, minHeight: SWAP_DRONES_PREVIEW_AREA_MIN_HEIGHT }}>
          {warningMessage !== null ? (
            <Alert severity='warning' variant='outlined'>
              {warningMessage}
            </Alert>
          ) : preview.kind === 'placeholder' ? (
            <Typography variant='body2' color='text.secondary'>
              {preview.message}
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
        <Button disabled={!canSwap} onClick={handleSwap} color='primary'>
          {t('swapDronesDialog.action.swap')}
        </Button>
      </DialogActions>
    </DraggableDialog>
  );
};

const SwapDronesDialog = (props: Props) => {
  const prevOpenRef = useRef(false);
  const sessionRef = useRef(0);

  if (props.open && !prevOpenRef.current) {
    sessionRef.current += 1;
  }

  prevOpenRef.current = props.open;

  return <SwapDronesDialogBody key={sessionRef.current} {...props} />;
};

export default connect(
  (state: RootState): StateProps => ({
    open: isSwapDronesDialogOpen(state),
    blocked: !isSwappingAllowed(state),
    onlineUavIds: getUAVIdList(state),
    openUploadDialogAfterSwap: shouldOpenUploadDialogAfterSwap(state),
    reverseMissionMapping: getReverseMissionMapping(state),
  }),
  {
    onApplySwap: applySwapDronesBatch,
    onClose: closeSwapDronesDialog,
    onSetOpenUploadDialogAfterSwap: setOpenUploadAfterSwap,
  }
)(SwapDronesDialog);

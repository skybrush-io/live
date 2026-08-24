import SwapHoriz from '@mui/icons-material/SwapHoriz';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Collapse from '@mui/material/Collapse';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import FormControlLabel from '@mui/material/FormControlLabel';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { nanoid } from 'nanoid';
import {
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import { DraggableDialog } from '@skybrush/mui-components';

import { getReverseMissionMapping } from '~/features/mission/selectors';
import { isShowAuthorizedToStart } from '~/features/show/selectors';
import { showSuccess } from '~/features/snackbar/actions';
import { isUploadInProgress } from '~/features/upload/selectors';
import type { MissionIndex } from '~/model/missions';
import type { RootState } from '~/store/reducers';
import type { Identifier } from '~/utils/collections';

import { applySwapDronesBatch } from './actions';
import {
  SWAP_DRONES_FORM_COLUMN_WIDTH,
  SWAP_DRONES_QUEUE_COLUMN_WIDTH,
} from './constants';
import { closeSwapDronesDialog, isSwapDronesDialogOpen } from './details';
import { getUAVIdList } from './selectors';
import SwapDroneField from './SwapDroneField';
import SwapDronesConfirmDialog from './SwapDronesConfirmDialog';
import SwapDronesPreview from './SwapDronesPreview';
import SwapDronesQueuePanel from './SwapDronesQueuePanel';
import {
  buildSwapApplyPairs,
  buildSwapPreview,
  currentPairOverlapsQueue,
  emptySwapSlot,
  validateSwapBatch,
  type SwapApplyPair,
  type SwapQueuedPair,
  type SwapSlotState,
} from './utils';

/**
 * Retains the last non-null value so that the contents of a collapsing region
 * stay visible until the exit transition has finished.
 */
const useLastNonNull = <T,>(value: T | null) => {
  const lastValueRef = useRef<T | null>(value);

  useLayoutEffect(() => {
    if (value !== null) {
      lastValueRef.current = value;
    }
  }, [value]);

  return value ?? lastValueRef.current;
};

type StateProps = {
  blocked: boolean;
  onlineUavIds: Identifier[];
  open: boolean;
  reverseMissionMapping: Readonly<Record<string, MissionIndex>>;
};

type DispatchProps = {
  onApplySwap: (
    pairs: SwapApplyPair[],
    options?: { openUploadAfterSwap?: boolean }
  ) => void;
  onClose: () => void;
};

type Props = DispatchProps & StateProps;

const SwapDronesDialogBody = ({
  blocked,
  onlineUavIds,
  onApplySwap,
  onClose,
  open,
  reverseMissionMapping,
}: Props) => {
  const { t } = useTranslation();
  const [slot1, setSlot1] = useState<SwapSlotState>(emptySwapSlot);
  const [slot2, setSlot2] = useState<SwapSlotState>(emptySwapSlot);
  const [queue, setQueue] = useState<SwapQueuedPair[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmPairs, setConfirmPairs] = useState<SwapApplyPair[]>([]);
  const [openUploadAfterSwap, setOpenUploadAfterSwap] = useState(true);

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

  // Warning, placeholder and preview live in three mutually exclusive collapsing
  // regions so that every height change of the dialog is animated. Their contents
  // are latched, otherwise they would blank out before the exit transition ends.
  const lastWarningMessage = useLastNonNull(warningMessage);
  const lastPlaceholderMessage = useLastNonNull(
    preview.kind === 'placeholder' ? preview.message : null
  );
  const lastPreviewLines = useLastNonNull(
    preview.kind === 'ready' ? preview.lines : null
  );

  const hasQueue = queue.length > 0;

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
    setSlot1(emptySwapSlot());
    setSlot2(emptySwapSlot());
  };

  const handleRemoveFromQueue = useCallback((id: string) => {
    setQueue((current) => current.filter((pair) => pair.id !== id));
  }, []);

  const applySwapBatch = (pairs: SwapApplyPair[]) => {
    onApplySwap(pairs, { openUploadAfterSwap });
    setConfirmOpen(false);
    setConfirmPairs([]);
    setSlot1(emptySwapSlot());
    setSlot2(emptySwapSlot());
    setQueue([]);
    showSuccess(t('swapDronesDialog.success'));
    onClose();
  };

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

    if (queue.length === 0) {
      applySwapBatch(pairs);
      return;
    }

    setConfirmPairs(pairs);
    setConfirmOpen(true);
  };

  const handleConfirmCancel = () => {
    setConfirmOpen(false);
  };

  const handleConfirm = () => {
    if (!batchValidation.valid || warningMessage !== null) {
      setConfirmOpen(false);
      return;
    }

    applySwapBatch(
      buildSwapApplyPairs(
        queue,
        batchValidation.applyCurrentPair,
        slot1.resolved,
        slot2.resolved
      )
    );
  };

  return (
    <DraggableDialog
      maxWidth={false}
      open={open}
      title={t('swapDronesDialog.title')}
      onClose={onClose}
    >
      <DialogContent>
        <Box
          sx={(theme) => ({
            display: 'flex',
            pt: 1,
            width:
              SWAP_DRONES_FORM_COLUMN_WIDTH +
              (hasQueue ? SWAP_DRONES_QUEUE_COLUMN_WIDTH : 0),
            transition: theme.transitions.create('width'),
          })}
        >
          <Collapse
            in={hasQueue}
            orientation='horizontal'
            sx={{ flexShrink: 0 }}
          >
            <SwapDronesQueuePanel
              queue={queue}
              onRemove={handleRemoveFromQueue}
            />
          </Collapse>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Stack direction='row' spacing={1.5} alignItems='flex-end'>
              <SwapDroneField
                side='left'
                slot={slot1}
                onSlotChange={setSlot1}
              />
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  color: 'text.secondary',
                  flexShrink: 0,
                  pb: 1,
                }}
              >
                <SwapHoriz />
              </Box>
              <SwapDroneField
                side='right'
                slot={slot2}
                onSlotChange={setSlot2}
              />
              <Button
                variant='outlined'
                disabled={!canAdd}
                sx={{ flexShrink: 0, mb: 0.25 }}
                onClick={handleAdd}
              >
                {t('swapDronesDialog.action.add')}
              </Button>
            </Stack>

            <Collapse in={warningMessage !== null}>
              <Box sx={{ pt: 2 }}>
                <Alert severity='warning' variant='outlined'>
                  {lastWarningMessage}
                </Alert>
              </Box>
            </Collapse>

            <Collapse
              in={warningMessage === null && preview.kind === 'placeholder'}
            >
              <Box sx={{ pt: 2 }}>
                <Typography variant='body2' color='text.secondary'>
                  {lastPlaceholderMessage}
                </Typography>
              </Box>
            </Collapse>

            <Collapse in={warningMessage === null && preview.kind === 'ready'}>
              <Box sx={{ pt: 2 }}>
                {lastPreviewLines && (
                  <SwapDronesPreview lines={lastPreviewLines} />
                )}
              </Box>
            </Collapse>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <FormControlLabel
          label={t('swapDronesDialog.openUploadAfterSwap')}
          control={
            <Checkbox
              checked={openUploadAfterSwap}
              onChange={(event) => {
                setOpenUploadAfterSwap(event.target.checked);
              }}
            />
          }
          sx={{ ml: 0 }}
        />
        <Box sx={{ flex: 1 }} />
        <Button color='inherit' onClick={onClose}>
          {t('general.action.cancel')}
        </Button>
        <Button variant='contained' disabled={!canSwap} onClick={handleSwap}>
          {t('swapDronesDialog.action.swap')}
        </Button>
      </DialogActions>
      <SwapDronesConfirmDialog
        open={confirmOpen}
        pairs={confirmPairs}
        onCancel={handleConfirmCancel}
        onConfirm={handleConfirm}
      />
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
    blocked: isShowAuthorizedToStart(state) || isUploadInProgress(state),
    onlineUavIds: getUAVIdList(state),
    reverseMissionMapping: getReverseMissionMapping(state),
  }),
  {
    onApplySwap: applySwapDronesBatch,
    onClose: closeSwapDronesDialog,
  }
)(SwapDronesDialog);

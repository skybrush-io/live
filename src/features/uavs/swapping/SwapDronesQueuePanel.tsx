import Close from '@mui/icons-material/Close';
import SwapHoriz from '@mui/icons-material/SwapHoriz';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import DialogActions from '@mui/material/DialogActions';
import IconButton from '@mui/material/IconButton';
import isNil from 'lodash-es/isNil';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import { Tooltip } from '@skybrush/mui-components';

import ItemListSidebarHeader from '~/components/ItemListSidebarHeader';
import { getUAVIdList } from '~/features/uavs/selectors';
import type { RootState } from '~/store/reducers';
import type { Identifier } from '~/utils/collections';

import { addCurrentPairToSwapQueue, executeSwapQueue } from './actions';
import {
  SWAP_DRONES_DIALOG_ACTIONS_MIN_HEIGHT,
  SWAP_DRONES_QUEUE_COLUMN_WIDTH,
} from './constants';
import {
  canAddCurrentSwapPairToQueue,
  canExecuteSwapQueue,
  getFailedSwapQueueIndex,
  getResolvedSwapQueue,
  getSwapQueue,
} from './selectors';
import { clearSwapQueue, removePairFromSwapQueue } from './slice';
import DroneRefLabel from './DroneRefLabel';
import SwapDroneBadge from './SwapDroneBadge';
import type {
  DroneRef,
  DroneRefPairWithId,
  PartiallyResolvedDronePair,
  SwapEndpoint,
} from './types';

/**
 * Returns whether the drone that a queued reference refers to is not online.
 * The drone of a slot reference is known only if the reference was resolved.
 */
const isOffline = (
  ref: DroneRef,
  resolved: SwapEndpoint | null | undefined,
  onlineUavIds: readonly Identifier[]
): boolean => {
  const uavId = ref.kind === 'uav' ? ref.uavId : resolved?.uavId;
  return !isNil(uavId) && !onlineUavIds.includes(uavId);
};

type StateProps = {
  canAdd: boolean;
  canSwap: boolean;
  failedIndex: number | null;
  onlineUavIds: Identifier[];
  queue: DroneRefPairWithId[];
  resolvedQueue: PartiallyResolvedDronePair[];
};

type DispatchProps = {
  onAdd: () => void;
  onRemove: (id: string) => void;
  onRemoveAll: () => void;
  onSwap: () => void;
};

type SwapDronesQueuePanelProps = StateProps & DispatchProps;

/**
 * Sidebar of the swap drones dialog that lists the queued swaps, with the first
 * swap that can no longer be executed highlighted.
 */
const SwapDronesQueuePanel = ({
  canAdd,
  canSwap,
  failedIndex,
  onAdd,
  onRemove,
  onRemoveAll,
  onSwap,
  onlineUavIds,
  queue,
  resolvedQueue,
}: SwapDronesQueuePanelProps) => {
  const { t } = useTranslation();

  return (
    // Zero height with full minimum height so that the queue does not grow the
    // dialog; it scrolls instead
    <Box
      sx={{
        width: SWAP_DRONES_QUEUE_COLUMN_WIDTH,
        height: 0,
        minHeight: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <ItemListSidebarHeader
        removeAllDisabled={queue.length === 0}
        removeAllLabel={t('swapDronesDialog.queue.removeAll')}
        title={t('swapDronesDialog.queue.title')}
        onRemoveAllItems={onRemoveAll}
      />
      <Box sx={{ flex: 1, overflow: 'auto', p: 1 }}>
        {queue.map((pair, index) => (
          <Box
            key={pair.id}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              mb: 0.75,
              borderRadius: 1,
              outline: index === failedIndex ? '1px solid' : 'none',
              outlineColor: 'error.main',
            }}
          >
            <Box sx={{ flex: 1, textAlign: 'right' }}>
              <SwapDroneBadge
                side='left'
                offline={isOffline(
                  pair.drone1,
                  resolvedQueue[index]?.drone1,
                  onlineUavIds
                )}
                label={
                  <DroneRefLabel
                    droneRef={pair.drone1}
                    resolved={resolvedQueue[index]?.drone1}
                  />
                }
              />
            </Box>
            <SwapHoriz sx={{ fontSize: 16, color: 'text.secondary' }} />
            <Box sx={{ flex: 1 }}>
              <SwapDroneBadge
                side='right'
                offline={isOffline(
                  pair.drone2,
                  resolvedQueue[index]?.drone2,
                  onlineUavIds
                )}
                label={
                  <DroneRefLabel
                    droneRef={pair.drone2}
                    resolved={resolvedQueue[index]?.drone2}
                  />
                }
              />
            </Box>
            <Tooltip content={t('general.action.remove')}>
              <IconButton
                size='small'
                aria-label={t('general.action.remove')}
                sx={{ flexShrink: 0 }}
                onClick={() => {
                  onRemove(pair.id);
                }}
              >
                <Close fontSize='small' />
              </IconButton>
            </Tooltip>
          </Box>
        ))}
      </Box>
      <DialogActions
        sx={{
          minHeight: SWAP_DRONES_DIALOG_ACTIONS_MIN_HEIGHT,
          justifyContent: 'space-between',
        }}
      >
        <Button disabled={!canAdd} color='inherit' onClick={onAdd}>
          {t('swapDronesDialog.action.add')}
        </Button>
        <Button disabled={!canSwap} color='inherit' onClick={onSwap}>
          {t('swapDronesDialog.action.swapQueue')}
        </Button>
      </DialogActions>
    </Box>
  );
};

export default connect(
  (state: RootState): StateProps => ({
    canAdd: canAddCurrentSwapPairToQueue(state),
    canSwap: canExecuteSwapQueue(state),
    failedIndex: getFailedSwapQueueIndex(state),
    onlineUavIds: getUAVIdList(state),
    queue: getSwapQueue(state),
    resolvedQueue: getResolvedSwapQueue(state),
  }),
  {
    onAdd: addCurrentPairToSwapQueue,
    onRemove: removePairFromSwapQueue,
    onRemoveAll: clearSwapQueue,
    onSwap: executeSwapQueue,
  }
)(SwapDronesQueuePanel);

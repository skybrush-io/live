import Close from '@mui/icons-material/Close';
import PlaylistAdd from '@mui/icons-material/PlaylistAdd';
import SwapHoriz from '@mui/icons-material/SwapHoriz';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Collapse from '@mui/material/Collapse';
import DialogActions from '@mui/material/DialogActions';
import IconButton from '@mui/material/IconButton';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import { TransitionGroup } from 'react-transition-group';

import { Tooltip } from '@skybrush/mui-components';

import type { RootState } from '~/store/reducers';

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
import { removePairFromSwapQueue } from './slice';
import DroneRefLabel from './DroneRefLabel';
import SwapDroneBadge from './SwapDroneBadge';
import type { DroneRefPairWithId, PartiallyResolvedDronePair } from './types';

type SwapDronesQueuePanelProps = {
  canAdd: boolean;
  canSwap: boolean;
  failedIndex: number | null;
  onAdd: () => void;
  onRemove: (id: string) => void;
  onSwap: () => void;
  queue: DroneRefPairWithId[];
  resolvedQueue: PartiallyResolvedDronePair[];
};

const SwapDronesQueuePanel = ({
  canAdd,
  canSwap,
  failedIndex,
  onAdd,
  onRemove,
  onSwap,
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
      <TransitionGroup component={Box} sx={{ flex: 1, overflow: 'auto', p: 1 }}>
        {queue.map((pair, index) => (
          <Collapse key={pair.id}>
            <Box
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
          </Collapse>
        ))}
      </TransitionGroup>
      <DialogActions
        sx={{
          minHeight: SWAP_DRONES_DIALOG_ACTIONS_MIN_HEIGHT,
          justifyContent: 'space-between',
        }}
      >
        <Tooltip content={t('swapDronesDialog.action.add')}>
          {/* Wrapper needed so that the tooltip works on a disabled button */}
          <span>
            <IconButton
              size='small'
              disabled={!canAdd}
              aria-label={t('swapDronesDialog.action.add')}
              onClick={onAdd}
            >
              <PlaylistAdd fontSize='small' />
            </IconButton>
          </span>
        </Tooltip>
        <Button disabled={!canSwap} color='inherit' onClick={onSwap}>
          {t('swapDronesDialog.action.swapQueue')}
        </Button>
      </DialogActions>
    </Box>
  );
};

export default connect(
  (state: RootState) => ({
    canAdd: canAddCurrentSwapPairToQueue(state),
    canSwap: canExecuteSwapQueue(state),
    failedIndex: getFailedSwapQueueIndex(state),
    queue: getSwapQueue(state),
    resolvedQueue: getResolvedSwapQueue(state),
  }),
  {
    onAdd: addCurrentPairToSwapQueue,
    onRemove: removePairFromSwapQueue,
    onSwap: executeSwapQueue,
  }
)(SwapDronesQueuePanel);

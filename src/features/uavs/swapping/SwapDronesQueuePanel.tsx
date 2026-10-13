import Close from '@mui/icons-material/Close';
import SwapHoriz from '@mui/icons-material/SwapHoriz';
import Box from '@mui/material/Box';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import { TransitionGroup } from 'react-transition-group';

import { Tooltip } from '@skybrush/mui-components';

import type { RootState } from '~/store/reducers';

import { SWAP_DRONES_QUEUE_COLUMN_WIDTH } from './constants';
import { getSwapQueue } from './selectors';
import { removePairFromSwapQueue } from './slice';
import SwapDroneBadge from './SwapDroneBadge';
import type { ResolvedDronePairWithId } from './types';
import { swapDroneRef } from './utils';

type SwapDronesQueuePanelProps = {
  onRemove: (id: string) => void;
  queue: ResolvedDronePairWithId[];
};

const SwapDronesQueuePanel = ({
  onRemove,
  queue,
}: SwapDronesQueuePanelProps) => {
  const { t } = useTranslation();

  return (
    <Box sx={{ width: SWAP_DRONES_QUEUE_COLUMN_WIDTH, height: '100%', p: 1 }}>
      <TransitionGroup>
        {queue.map((pair) => (
          <Collapse key={pair.id}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                pb: 0.75,
              }}
            >
              <Box sx={{ flex: 1, textAlign: 'right' }}>
                <SwapDroneBadge side='left' label={swapDroneRef(pair.drone1)} />
              </Box>
              <SwapHoriz sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Box sx={{ flex: 1 }}>
                <SwapDroneBadge
                  side='right'
                  label={swapDroneRef(pair.drone2)}
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
    </Box>
  );
};

export default connect(
  (state: RootState) => ({
    queue: getSwapQueue(state),
  }),
  {
    onRemove: removePairFromSwapQueue,
  }
)(SwapDronesQueuePanel);

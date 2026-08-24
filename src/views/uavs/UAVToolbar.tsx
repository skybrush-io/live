import ImageBlurCircular from '@mui/icons-material/BlurCircular';
import ImageBlurOn from '@mui/icons-material/BlurOn';
import SwapHoriz from '@mui/icons-material/SwapHoriz';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Toolbar, { type ToolbarProps } from '@mui/material/Toolbar';
import isEmpty from 'lodash-es/isEmpty';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import UAVOperationsButtonGroup from '~/components/uavs/UAVOperationsButtonGroup';
import { TooltipWithContainerFromContext as Tooltip } from '~/containerContext';
import { showSwapDronesDialog } from '~/features/uavs/details';
import { isBroadcast } from '~/features/session/selectors';
import { getSelectedUAVIds } from '~/features/uavs/selectors';
import type { RootState } from '~/store/reducers';

import MappingButtonGroup from './MappingButtonGroup';

type UAVToolbarProps = ToolbarProps &
  Readonly<{
    fitSelectedUAVs?: () => void;
    isBroadcast: boolean;
    onShowSwapDronesDialog: () => void;
    selectedUAVIds: string[];
  }>;

/**
 * Main toolbar for controlling the UAVs.
 */
const UAVToolbar = ({
  fitSelectedUAVs,
  isBroadcast,
  onShowSwapDronesDialog,
  selectedUAVIds,
  ...rest
}: UAVToolbarProps) => {
  const isSelectionEmpty = isEmpty(selectedUAVIds);
  const { t } = useTranslation();

  return (
    <Toolbar disableGutters variant='dense' {...rest}>
      <Box sx={{ width: '4px' }} />

      <UAVOperationsButtonGroup
        broadcast={isBroadcast}
        selectedUAVIds={selectedUAVIds}
        showColorOverrideBadges
      />

      <Box sx={{ flex: 1 }} />

      {fitSelectedUAVs && (
        <Tooltip
          content={
            isSelectionEmpty
              ? t('uavToolbar.fitAllFeaturesIntoView')
              : t('uavToolbar.fitSelectionIntoView')
          }
        >
          <IconButton
            style={{ float: 'right' }}
            size='large'
            onClick={fitSelectedUAVs}
          >
            {isSelectionEmpty ? <ImageBlurOn /> : <ImageBlurCircular />}
          </IconButton>
        </Tooltip>
      )}

      <Tooltip
        content={t('swapDronesDialog.toolbarButton')}
        // Explicitly set trigger to 'mouseenter' only to prevent the tooltip
        // from showing when the dialog closes and focus returns to this button.
        trigger='mouseenter'
      >
        <IconButton
          aria-label={t('swapDronesDialog.toolbarButton')}
          size='large'
          onClick={onShowSwapDronesDialog}
        >
          <SwapHoriz />
        </IconButton>
      </Tooltip>

      <MappingButtonGroup />
    </Toolbar>
  );
};

export default connect(
  // mapStateToProps
  (state: RootState) => ({
    isBroadcast: isBroadcast(state),
    selectedUAVIds: getSelectedUAVIds(state),
  }),
  // mapDispatchToProps
  {
    onShowSwapDronesDialog: showSwapDronesDialog,
  },
  null,
  {
    forwardRef: true,
  }
)(UAVToolbar);

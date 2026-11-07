import SwapHoriz from '@mui/icons-material/SwapHoriz';
import IconButton from '@mui/material/IconButton';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import { TooltipWithContainerFromContext as Tooltip } from '~/containerContext';

import { showSwapDronesDialog } from './slice';

type SwapDronesToolbarButtonProps = {
  onShowSwapDronesDialog: () => void;
};

/**
 * Toolbar button that opens the swap drones dialog.
 */
const SwapDronesToolbarButton = ({
  onShowSwapDronesDialog,
}: SwapDronesToolbarButtonProps) => {
  const { t } = useTranslation();

  return (
    <Tooltip
      content={t('swapDronesDialog.toolbarButton')}
      // Explicitly set trigger to 'mouseenter' only to prevent the tooltip
      // from showing when the dialog closes and focus returns to this button.
      trigger='mouseenter'
    >
      <IconButton
        aria-label={t('swapDronesDialog.toolbarButton')}
        onClick={onShowSwapDronesDialog}
      >
        <SwapHoriz />
      </IconButton>
    </Tooltip>
  );
};

export default connect(null, {
  onShowSwapDronesDialog: showSwapDronesDialog,
})(SwapDronesToolbarButton);

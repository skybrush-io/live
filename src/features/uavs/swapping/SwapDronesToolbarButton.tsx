import SwapHoriz from '@mui/icons-material/SwapHoriz';
import IconButton from '@mui/material/IconButton';
import { Tooltip } from '@skybrush/mui-components';
import { useTranslation } from 'react-i18next';

import { useAppDispatch } from '~/store/hooks';

import { showSwapDronesDialog } from './slice';

const SwapDronesToolbarButton = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  return (
    <Tooltip
      content={t('swapDronesDialog.toolbarButton')}
      // Explicitly set trigger to 'mouseenter' only to prevent the tooltip
      // from showing when the dialog closes and focus returns to this button.
      trigger='mouseenter'
    >
      <IconButton
        onClick={() => {
          dispatch(showSwapDronesDialog());
        }}
      >
        <SwapHoriz />
      </IconButton>
    </Tooltip>
  );
};

export default SwapDronesToolbarButton;

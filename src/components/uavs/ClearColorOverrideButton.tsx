import HighlightOff from '@mui/icons-material/HighlightOff';
import IconButton from '@mui/material/IconButton';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

import { TooltipWithContainerFromContext as Tooltip } from '~/containerContext';
import {
  clearAllUAVColorOverrides,
  clearUAVColorOverride,
  hasUAVColorOverride,
} from '~/features/uavs/actions';
import { useAppDispatch } from '~/store/hooks';
import type { RootState } from '~/store/reducers';

type Props = {
  uavIds: string[];
  size?: 'small' | 'medium' | 'large' | undefined;
};

const ClearColorOverrideButton = ({ size, uavIds }: Props) => {
  const dispatch = useAppDispatch();
  const selector =
    uavIds.length === 1
      ? (state: RootState) => hasUAVColorOverride(state, uavIds[0])
      : hasUAVColorOverride;
  const hasColorOverride = useSelector(selector);
  const { t } = useTranslation();
  return (
    <Tooltip content={t('general.commands.clearLEDColor')}>
      <IconButton
        disabled={!hasColorOverride}
        size={size}
        onClick={() => {
          dispatch(
            uavIds.length > 0
              ? clearUAVColorOverride(uavIds)
              : clearAllUAVColorOverrides()
          );
        }}
      >
        <HighlightOff fontSize='inherit' />
      </IconButton>
    </Tooltip>
  );
};

export default ClearColorOverrideButton;

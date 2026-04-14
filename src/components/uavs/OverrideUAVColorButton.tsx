import Circle from '@mui/icons-material/Circle';
import IconButton from '@mui/material/IconButton';
import { Colors } from '@skybrush/app-theme-mui';
import { SidebarBadge } from '@skybrush/mui-components';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

import { TooltipWithContainerFromContext as Tooltip } from '~/containerContext';
import {
  clearUAVColorOverride,
  clearUAVColorOverrideForColor,
  overrideUAVColor,
} from '~/features/uavs/actions';
import { getUAVIdsWithColorOverride } from '~/features/uavs/selectors';
import { useAppDispatch } from '~/store/hooks';
import type { RootState } from '~/store/reducers';

type Props = {
  uavIds: string[];
  color: string;
  showBadge?: boolean;
  size?: 'small' | 'medium' | 'large' | undefined;
};

const OverrideUAVColorButton = ({ color, showBadge, size, uavIds }: Props) => {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const selector = useMemo(
    () => (state: RootState) => getUAVIdsWithColorOverride(state, color),
    [color]
  );
  const overriddenUAVIds = useSelector(selector);
  const disabled = overriddenUAVIds.length == 0 && uavIds.length == 0;
  const singleUAVMode = uavIds.length === 1;
  const operation: 'set' | 'clearAll' | 'clearSingle' = singleUAVMode
    ? overriddenUAVIds.includes(uavIds[0])
      ? 'clearSingle'
      : 'set'
    : uavIds.length === 0
      ? 'clearAll'
      : 'set';

  return (
    <Tooltip
      content={
        operation === 'set'
          ? t('general.commands.setLEDColor')
          : t('general.commands.clearLEDColor')
      }
      key={`setColor${color}`}
    >
      <IconButton
        disabled={disabled}
        size={size}
        onClick={() => {
          if (operation === 'set') {
            dispatch(overrideUAVColor(uavIds, color));
          } else if (operation === 'clearSingle') {
            dispatch(clearUAVColorOverride(uavIds));
          } else {
            dispatch(clearUAVColorOverrideForColor(color));
          }
        }}
      >
        <Circle fontSize='inherit' htmlColor={disabled ? undefined : color} />
        {showBadge ? (
          <SidebarBadge
            visible={overriddenUAVIds.length > 0}
            color={Colors.warning}
          />
        ) : null}
      </IconButton>
    </Tooltip>
  );
};

export default OverrideUAVColorButton;

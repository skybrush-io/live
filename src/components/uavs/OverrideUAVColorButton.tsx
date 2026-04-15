import CircleOff from '@mui/icons-material/Cancel';
import CircleOffOutlined from '@mui/icons-material/CancelOutlined';
import CircleOn from '@mui/icons-material/Circle';
import CircleOnOutlined from '@mui/icons-material/CircleOutlined';
import IconButton from '@mui/material/IconButton';
import { useTheme } from '@mui/material/styles';
import { Colors, isThemeDark } from '@skybrush/app-theme-mui';
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
  const theme = useTheme();
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

  // Make sure that we can see a white circle in light mode
  const needsOutline = !isThemeDark(theme) && color === '#ffffff' && !disabled;
  const iconColor = needsOutline ? 'black' : color;
  const iconIsOn = operation === 'set' || disabled;
  const Icon = needsOutline
    ? iconIsOn
      ? CircleOnOutlined
      : CircleOffOutlined
    : iconIsOn
      ? CircleOn
      : CircleOff;

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
        <Icon fontSize='inherit' htmlColor={disabled ? undefined : iconColor} />
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

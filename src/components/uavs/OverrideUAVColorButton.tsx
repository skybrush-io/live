import Circle from '@mui/icons-material/Circle';
import IconButton from '@mui/material/IconButton';
import { Colors } from '@skybrush/app-theme-mui';
import { SidebarBadge } from '@skybrush/mui-components';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

import { TooltipWithContainerFromContext as Tooltip } from '~/containerContext';
import { overrideUAVColor } from '~/features/uavs/actions';
import { countUAVsWithColorOverride } from '~/features/uavs/selectors';
import { useAppDispatch } from '~/store/hooks';
import type { RootState } from '~/store/reducers';

type Props = {
  disabled?: boolean;
  uavIds: string[];
  color: string;
  showBadge?: boolean;
  size?: 'small' | 'medium' | 'large' | undefined;
};

const OverrideUAVColorButton = ({
  color,
  disabled,
  showBadge,
  size,
  uavIds,
}: Props) => {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const selector = useMemo(
    () => (state: RootState) => countUAVsWithColorOverride(state, color),
    [color]
  );
  const count = useSelector(selector);

  return (
    <Tooltip
      content={t('general.commands.setLEDColor')}
      key={`setColor${color}`}
    >
      <IconButton
        disabled={disabled}
        size={size}
        onClick={() => {
          dispatch(overrideUAVColor(uavIds, color));
        }}
      >
        <Circle fontSize='inherit' htmlColor={disabled ? undefined : color} />
        {showBadge ? (
          <SidebarBadge visible={count > 0} color={Colors.warning} />
        ) : null}
      </IconButton>
    </Tooltip>
  );
};

export default OverrideUAVColorButton;

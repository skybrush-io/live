import CenterFocusStrong from '@mui/icons-material/CenterFocusStrong';
import ZoomOut from '@mui/icons-material/ZoomOut';
import IconButton from '@mui/material/IconButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import { useTranslation } from 'react-i18next';

import { Tooltip } from '@skybrush/mui-components';

import ToggleButton from '~/components/ToggleButton';
import ToolbarDivider from '~/components/ToolbarDivider';
import { NavigationMode } from '~/features/three-d/types';

type Props = {
  mode: NavigationMode;
  onChange: (mode: NavigationMode) => void;
  onResetZoom?: () => void;
  onRotateCameraTowardsDrones?: () => void;
};

/**
 * Button group that allows the user to select the navigation mode currently
 * used in the 3D view.
 */
const NavigationButtonGroup = ({
  mode,
  onChange,
  onResetZoom,
  onRotateCameraTowardsDrones,
}: Props) => {
  const { t } = useTranslation();

  return (
    <>
      <ToggleButtonGroup size='small'>
        <ToggleButton
          selected={mode === NavigationMode.WALK}
          value={NavigationMode.WALK}
          onClick={() => onChange(NavigationMode.WALK)}
        >
          {t('navigationButtonGroup.walk')}
        </ToggleButton>
        <ToggleButton
          selected={mode === NavigationMode.FLY}
          value={NavigationMode.FLY}
          onClick={() => onChange(NavigationMode.FLY)}
        >
          {t('navigationButtonGroup.fly')}
        </ToggleButton>
      </ToggleButtonGroup>
      <ToolbarDivider orientation='vertical' />
      <Tooltip content={t('navigationButtonGroup.resetZoom')}>
        <IconButton
          disableRipple
          disabled={!onResetZoom}
          size='large'
          onClick={onResetZoom}
        >
          <ZoomOut />
        </IconButton>
      </Tooltip>
      <Tooltip content={t('navigationButtonGroup.rotateCamera')}>
        <IconButton
          disableRipple
          disabled={!onRotateCameraTowardsDrones}
          size='large'
          onClick={onRotateCameraTowardsDrones}
        >
          <CenterFocusStrong />
        </IconButton>
      </Tooltip>
    </>
  );
};

export default NavigationButtonGroup;

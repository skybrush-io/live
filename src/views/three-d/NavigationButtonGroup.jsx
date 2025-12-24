import CenterFocusStrong from '@mui/icons-material/CenterFocusStrong';
import ZoomOut from '@mui/icons-material/ZoomOut';
import IconButton from '@mui/material/IconButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import PropTypes from 'prop-types';
import { withTranslation } from 'react-i18next';

import { Tooltip } from '@skybrush/mui-components';

import ToggleButton from '~/components/ToggleButton';
import ToolbarDivider from '~/components/ToolbarDivider';

/**
 * Button group that allows the user to select the navigation mode currently
 * used in the 3D view.
 */
const NavigationButtonGroupPresentation = ({
  mode,
  onChange,
  onResetZoom,
  onRotateCameraTowardsDrones,
  t,
}) => (
  <>
    <ToggleButtonGroup size='small'>
      <ToggleButton
        selected={mode === 'walk'}
        value='walk'
        onClick={() => onChange('walk')}
      >
        {t('navigationButtonGroup.walk')}
      </ToggleButton>
      <ToggleButton
        selected={mode === 'fly'}
        value='fly'
        onClick={() => onChange('fly')}
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

NavigationButtonGroupPresentation.propTypes = {
  mode: PropTypes.oneOf(['walk', 'fly']),
  onChange: PropTypes.func,
  onResetZoom: PropTypes.func,
  onRotateCameraTowardsDrones: PropTypes.func,
  t: PropTypes.func,
};

export default withTranslation()(NavigationButtonGroupPresentation);

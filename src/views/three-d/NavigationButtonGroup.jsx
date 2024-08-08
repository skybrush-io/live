import PropTypes from 'prop-types';
import React from 'react';
import { withTranslation } from 'react-i18next';

import IconButton from '@material-ui/core/IconButton';
import CenterFocusStrong from '@material-ui/icons/CenterFocusStrong';
import ZoomOut from '@material-ui/icons/ZoomOut';
import ToggleButtonGroup from '@material-ui/lab/ToggleButtonGroup';

import Tooltip from '@skybrush/mui-components/lib/Tooltip';

import ToolbarDivider from '~/components/ToolbarDivider';
import ToggleButton from '~/components/ToggleButton';

/**
 * Button group that allows the user to select the navigation mode currently
 * used in the 3D view.
 */
const NavigationButtonGroup = withTranslation()(
  ({ mode, onChange, onResetZoom, onRotateCameraTowardsDrones, t }) => (
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
        <IconButton disableRipple disabled={!onResetZoom} onClick={onResetZoom}>
          <ZoomOut />
        </IconButton>
      </Tooltip>
      <Tooltip content={t('navigationButtonGroup.rotateCamera')}>
        <IconButton
          disableRipple
          disabled={!onRotateCameraTowardsDrones}
          onClick={onRotateCameraTowardsDrones}
        >
          <CenterFocusStrong />
        </IconButton>
      </Tooltip>
    </>
  )
);

NavigationButtonGroup.propTypes = {
  mode: PropTypes.oneOf(['walk', 'fly']),
  onChange: PropTypes.func,
  onResetZoom: PropTypes.func,
  onRotateCameraTowardsDrones: PropTypes.func,
  t: PropTypes.func,
};

export default NavigationButtonGroup;

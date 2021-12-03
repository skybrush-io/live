import PropTypes from 'prop-types';
import React from 'react';

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
const NavigationButtonGroup = ({
  mode,
  onChange,
  onResetZoom,
  onRotateCameraTowardsDrones,
}) => (
  <>
    <ToggleButtonGroup size='small'>
      <ToggleButton
        selected={mode === 'walk'}
        value='walk'
        onClick={() => onChange('walk')}
      >
        Walk
      </ToggleButton>
      <ToggleButton
        selected={mode === 'fly'}
        value='fly'
        onClick={() => onChange('fly')}
      >
        Fly
      </ToggleButton>
    </ToggleButtonGroup>
    <ToolbarDivider orientation='vertical' />
    <Tooltip content='Reset zoom'>
      <IconButton disableRipple disabled={!onResetZoom} onClick={onResetZoom}>
        <ZoomOut />
      </IconButton>
    </Tooltip>
    <Tooltip content='Rotate camera towards drones'>
      <IconButton
        disableRipple
        disabled={!onRotateCameraTowardsDrones}
        onClick={onRotateCameraTowardsDrones}
      >
        <CenterFocusStrong />
      </IconButton>
    </Tooltip>
  </>
);

NavigationButtonGroup.propTypes = {
  mode: PropTypes.oneOf(['walk', 'fly']),
  onChange: PropTypes.func,
  onResetZoom: PropTypes.func,
  onRotateCameraTowardsDrones: PropTypes.func,
};

export default NavigationButtonGroup;

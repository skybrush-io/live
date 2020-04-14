import PropTypes from 'prop-types';
import React from 'react';

import ToggleButtonGroup from '@material-ui/lab/ToggleButtonGroup';

import ToggleButton from '~/components/ToggleButton';

/**
 * Button group that allows the user to select the navigation mode currently
 * used in the 3D view.
 */
const NavigationButtonGroup = ({ mode, onChange }) => (
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
    <ToggleButton disabled selected={mode === 'track'} value='track'>
      Track
    </ToggleButton>
  </ToggleButtonGroup>
);

NavigationButtonGroup.propTypes = {
  mode: PropTypes.oneOf(['walk', 'fly']),
  onChange: PropTypes.func,
};

export default NavigationButtonGroup;

import React from 'react';

import withTheme from '@material-ui/core/styles/withTheme';

import FitAllFeaturesButton from '~/components/map/buttons/FitAllFeaturesButton';
import MapRotationTextBox from '~/components/map/MapRotationTextBox';

/**
 * Separator component for the toolbar.
 */
const MapToolbarSeparator = () => {
  return (
    <div
      style={{
        display: 'inline-block',
        height: '48px',
        borderLeft: '1px solid rgba(0, 0, 0,  0.172549)',
        verticalAlign: 'top',
      }}
    />
  );
};

type MapToolbarProps = {
  initialRotation?: number;
};

const MapToolbar = ({ initialRotation }: MapToolbarProps) => (
  <div>
    <MapRotationTextBox
      initialRotation={initialRotation}
      resetDuration={500}
      fieldWidth='75px'
      style={{
        display: 'inline-block',
        marginRight: '12px',
        verticalAlign: 'top',
      }}
    />

    <MapToolbarSeparator />

    {/* margin is calibrated such that the vertical drawing toolbar will not
     * cover any of the drones */}
    <FitAllFeaturesButton duration={500} margin={80} />
  </div>
);

const ThemedMapToolbar = withTheme(MapToolbar);
export default ThemedMapToolbar;

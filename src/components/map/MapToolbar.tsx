import React from 'react';
import { connect } from 'react-redux';

import withTheme from '@material-ui/core/styles/withTheme';

import { getMapViewRotationAngle } from '~/selectors/map';
import type { RootState } from '~/store/reducers';
import FitAllFeaturesButton from './buttons/FitAllFeaturesButton';
import MapRotationTextBox from './MapRotationTextBox';

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

const MapToolbarPresentation = ({ initialRotation }: MapToolbarProps) => (
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

const ThemedMapToolbarPresentation = withTheme(MapToolbarPresentation);

/**
 * Main toolbar on the map.
 *
 * Every map toolbar should be initialized with the rotation angle that is
 * stored in the application state, but take care, because writing that state
 * is not allowed for every map instance, so don't connect such actions to
 * this component.
 */
const MapToolbar = connect(
  // mapStateToProps
  (state: RootState) => ({
    initialRotation: getMapViewRotationAngle(state),
  }),
  // mapDispatchToProps
  null
)(ThemedMapToolbarPresentation);
export default MapToolbar;

import PropTypes from 'prop-types';
import React from 'react';

import withTheme from '@material-ui/core/styles/withTheme';

import { connect } from 'react-redux';

import { getSelectedTool } from '~/features/map/tools';
import { getMapViewRotationAngle } from '~/selectors/map';

import FitAllFeaturesButton from './FitAllFeaturesButton';
import MapRotationTextBox from './MapRotationTextBox';

/**
 * Separator component for the toolbar
 *
 * @returns {Object} the rendered component
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

/**
 * Presentation component for the map toolbar.
 *
 * @returns {React.Element} the rendered component
 */
const MapToolbarPresentation = ({ initialRotation }) => (
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

MapToolbarPresentation.propTypes = {
  initialRotation: PropTypes.number,
};

/**
 * Main toolbar on the map.
 */
const MapToolbar = connect(
  // mapStateToProps
  (state) => ({
    selectedTool: getSelectedTool(state),
    initialRotation: getMapViewRotationAngle(state),
  }),
  // mapDispatchToProps
  null
)(withTheme(MapToolbarPresentation));

export default MapToolbar;

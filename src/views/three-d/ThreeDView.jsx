/**
 * @file Component that shows a three-dimensional view of the drone flock.
 */

import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import CoordinateSystemAxes from './CoordinateSystemAxes';
import Scenery from './Scenery';

// eslint-disable-next-line no-unused-vars
import AFrame from '~/aframe';
import { isMapCoordinateSystemLeftHanded } from '~/selectors/map';

const ThreeDView = React.forwardRef(({ isCoordinateSystemLeftHanded }, ref) => (
  <a-scene ref={ref} deallocate embedded="true" vr-mode-ui="enabled: false">
    <a-camera look-controls="reverseMouseDrag: true" />

    <a-entity rotation="-90 0 90">
      <CoordinateSystemAxes leftHanded={isCoordinateSystemLeftHanded} />
    </a-entity>

    {/*
    <a-box position="-1 0.5 -3" rotation="0 45 0" color="#4CC3D9" />
    <a-sphere position="0 1.25 -5" radius="1.25" color="#EF2D5E" />
    <a-cylinder
      position="1 0.75 -3"
      radius="0.5"
      height="1.5"
      color="#FFC65D"
    />
    */}

    {/* Move the floor slightly down to ensure that the coordinate axes are nicely visible */}
    <Scenery type="night" />
  </a-scene>
));

ThreeDView.propTypes = {
  isCoordinateSystemLeftHanded: PropTypes.bool
};

export default connect(
  // mapStateToProps
  state => ({
    isCoordinateSystemLeftHanded: isMapCoordinateSystemLeftHanded(state)
  }),
  // mapDispatchToProps
  {},
  // mergeProps
  null,
  { forwardRef: true }
)(ThreeDView);

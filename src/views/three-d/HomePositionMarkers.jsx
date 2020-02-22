import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

/**
 * Component that renders the takeoff markers of the current mission on the
 * scene.
 */
const HomePositionMarkers = () => (
  <a-entity mixin="takeoff-marker" position="5 0 0" />
);

HomePositionMarkers.propTypes = {};

export default connect(
  // mapStateToProps
  () => ({}),
  // mapDispatchToProps
  null
)(HomePositionMarkers);

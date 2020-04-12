import config from 'config';

import PropTypes from 'prop-types';
import React from 'react';
import Tour from 'reactour';
import { connect } from 'react-redux';

import { dismissTour } from '~/features/tour/slice';

/**
 * Tour component that provides a quick walkthrough of the UI for the
 * first-time user.
 */
const Tour = ({ onClose, isOpen }) => (
  <Tour steps={config.tour ? config.tour.steps : []} isOpen={isOpen} onRequestClose={dismissTour} />
);

Tour.propTypes = {
  isOpen: PropTypes.bool,  
  onClose: PropTypes.func
};

export default connect(
  // mapStateToProps
  state => state.tour,
  // mapDispatchToProps
  {
    onClose: dismissTour
  }
)(Tour);

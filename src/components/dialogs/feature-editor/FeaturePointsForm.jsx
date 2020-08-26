import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

const FeaturePointsForm = ({}) => <div>Not implemented yet</div>;

FeaturePointsForm.propTypes = {
  feature: PropTypes.object.isRequired,
  featureId: PropTypes.string.isRequired,
};

export default connect(
  // mapStateToProps
  null,
  // mapDispatchToProps
  {}
)(FeaturePointsForm);

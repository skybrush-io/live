import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import Button from '@material-ui/core/Button';

import { recalculateMapping } from '~/features/mission/actions';
import { hasNonemptyMappingSlot } from '~/features/mission/selectors';
import AutoFix from '~/icons/AutoFix';

/**
 * Button that allows the user to recalculate the current mapping from scratch
 * based on the current positions of the drones and their takeoff positions.
 */
const RecalculateMappingButton = ({ hasNonemptyMappingSlot, ...rest }) => (
  <Button startIcon={<AutoFix />} {...rest}>
    {hasNonemptyMappingSlot ? 'Recalculate mapping' : 'Find optimal mapping'}
  </Button>
);

RecalculateMappingButton.propTypes = {
  hasNonemptyMappingSlot: PropTypes.bool,
};

export default connect(
  // mapStateToProps
  (state) => ({
    hasNonemptyMappingSlot: hasNonemptyMappingSlot(state),
  }),
  // mapDispatchToProps
  {
    onClick: recalculateMapping,
  }
)(RecalculateMappingButton);

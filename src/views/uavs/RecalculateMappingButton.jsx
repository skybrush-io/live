import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { withTranslation } from 'react-i18next';

import Button from '@material-ui/core/Button';

import { recalculateMapping } from '~/features/mission/actions';
import { hasNonemptyMappingSlot } from '~/features/mission/selectors';
import AutoFix from '~/icons/AutoFix';

/**
 * Button that allows the user to recalculate the current mapping from scratch
 * based on the current positions of the drones and their takeoff positions.
 */
const RecalculateMappingButton = ({ hasNonemptyMappingSlot, t, ...rest }) => (
  <Button startIcon={<AutoFix />} {...rest}>
    {hasNonemptyMappingSlot
      ? t('recalculateMappingButton.recalculateMapping')
      : t('recalculateMappingButton.findOptimalMapping')}
  </Button>
);

RecalculateMappingButton.propTypes = {
  hasNonemptyMappingSlot: PropTypes.bool,
  t: PropTypes.func,
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
)(withTranslation()(RecalculateMappingButton));

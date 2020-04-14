import React from 'react';
import { connect } from 'react-redux';

import IconButton from '@material-ui/core/IconButton';
import Shuffle from '@material-ui/icons/Shuffle';

import { augmentMappingAutomaticallyFromSpareDrones } from '~/features/mission/actions';
import { canAugmentMappingAutomaticallyFromSpareDrones } from '~/features/mission/selectors';

/**
 * Button that allows the user to augment the current mapping with spare
 * drones based on their current positions automatically.
 */
const AugmentMappingButton = (props) => (
  <IconButton {...props}>
    <Shuffle />
  </IconButton>
);

export default connect(
  // mapStateToProps
  (state) => ({
    disabled: !canAugmentMappingAutomaticallyFromSpareDrones(state),
  }),
  // mapDispatchToProps
  {
    onClick: augmentMappingAutomaticallyFromSpareDrones,
  }
)(AugmentMappingButton);

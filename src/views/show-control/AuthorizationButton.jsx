import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import Typography from '@material-ui/core/Typography';

import StepperStatusLight, {
  StepperStatus
} from '~/components/StepperStatusLight';
import {
  setShowAuthorization,
  synchronizeShowSettings
} from '~/features/show/slice';
import {
  countUAVsTakingOffAutomatically,
  isShowAuthorizedToStartLocally
} from '~/features/show/selectors';
import { getSetupStageStatuses } from '~/features/show/stages';

/**
 * Button that allows the user to express her explicit consent to starting the
 * drone show. Such an authorization is needed even if the show is set to start
 * in automatic mode.
 */
const AuthorizationButton = ({
  isAuthorized,
  numUAVsTakingOffAutomatically,
  status,
  ...rest
}) => (
  <ListItem
    button
    disabled={!isAuthorized && status === StepperStatus.OFF}
    selected={isAuthorized}
    {...rest}
  >
    <StepperStatusLight
      status={
        isAuthorized && status === StepperStatus.OFF
          ? StepperStatus.SKIPPED
          : status
      }
    />
    <ListItemText
      disableTypography
      primary={
        <Typography variant="button">
          {isAuthorized
            ? 'Show authorized to start'
            : 'Authorize start of show'}
        </Typography>
      }
      secondary={
        <Typography variant="body2" color="textSecondary">
          {isAuthorized
            ? numUAVsTakingOffAutomatically <= 0
              ? 'Click here to revoke authorization'
              : numUAVsTakingOffAutomatically === 1
              ? 'One drone will take off automatically'
              : `${numUAVsTakingOffAutomatically} drones will take off automatically`
            : 'Authorization required before takeoff'}
        </Typography>
      }
    />
  </ListItem>
);

AuthorizationButton.propTypes = {
  isAuthorized: PropTypes.bool,
  numUAVsTakingOffAutomatically: PropTypes.number,
  status: PropTypes.oneOf(Object.values(StepperStatus))
};

export default connect(
  // mapStateToProps
  state => ({
    isAuthorized: isShowAuthorizedToStartLocally(state),
    numUAVsTakingOffAutomatically: countUAVsTakingOffAutomatically(state),
    status: getSetupStageStatuses(state).authorization
  }),
  // mapDispatchToProps
  {
    onClick: () => (dispatch, getState) => {
      const state = getState();
      dispatch(setShowAuthorization(!isShowAuthorizedToStartLocally(state)));
      dispatch(synchronizeShowSettings('toServer'));
    }
  }
)(AuthorizationButton);

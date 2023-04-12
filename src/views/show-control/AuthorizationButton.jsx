import PropTypes from 'prop-types';
import React from 'react';
import { withTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import Typography from '@material-ui/core/Typography';
import StatusLight from '@skybrush/mui-components/lib/StatusLight';

import { Status } from '~/components/semantics';
import { setCommandsAreBroadcast } from '~/features/mission/slice';
import {
  setShowAuthorization,
  synchronizeShowSettings,
} from '~/features/show/slice';
import {
  countUAVsTakingOffAutomatically,
  isShowAuthorizedToStartLocally,
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
  t,
  ...rest
}) => (
  <ListItem
    button
    /* disabled={!isAuthorized && status === Status.OFF} */
    selected={isAuthorized}
    {...rest}
  >
    <StatusLight
      status={isAuthorized && status === Status.OFF ? Status.SKIPPED : status}
    />
    <ListItemText
      disableTypography
      primary={
        <Typography variant='button'>
          {isAuthorized
            ? t('show.authorized', 'Show authorized to start')
            : t('show.authorizeTheStart', 'Authorize start of show')}
        </Typography>
      }
      secondary={
        <Typography variant='body2' color='textSecondary'>
          {isAuthorized
            ? numUAVsTakingOffAutomatically <= 0
              ? t(
                  'show.revokeAuthorization',
                  'Click here to revoke authorization'
                )
              : numUAVsTakingOffAutomatically === 1
              ? t('show.takeOffOne', 'One drone will take off automatically')
              : t('show.takeOffMore', {
                  quantity: numUAVsTakingOffAutomatically,
                })
            : t(
                'show.authorizationReq',
                'Authorization required before takeoff'
              )}
        </Typography>
      }
    />
  </ListItem>
);

AuthorizationButton.propTypes = {
  isAuthorized: PropTypes.bool,
  numUAVsTakingOffAutomatically: PropTypes.number,
  status: PropTypes.oneOf(Object.values(Status)),
  t: PropTypes.func,
};

export default connect(
  // mapStateToProps
  (state) => ({
    isAuthorized: isShowAuthorizedToStartLocally(state),
    numUAVsTakingOffAutomatically: countUAVsTakingOffAutomatically(state),
    status: getSetupStageStatuses(state).authorization,
  }),
  // mapDispatchToProps
  {
    onClick: () => (dispatch, getState) => {
      const state = getState();
      const newAuthorizationState = !isShowAuthorizedToStartLocally(state);
      dispatch(setShowAuthorization(newAuthorizationState));
      dispatch(synchronizeShowSettings('toServer'));
      if (newAuthorizationState) {
        dispatch(setCommandsAreBroadcast(state));
      }
    },
  }
)(withTranslation()(AuthorizationButton));

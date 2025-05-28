import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import StatusLight from '@skybrush/mui-components/lib/StatusLight';
import PropTypes from 'prop-types';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import { Status } from '~/components/semantics';
import { setCommandsAreBroadcast } from '~/features/mission/slice';
import {
  countUAVsTakingOffAutomatically,
  isShowAuthorizedToStartLocally,
} from '~/features/show/selectors';
import {
  setShowAuthorization,
  synchronizeShowSettings,
} from '~/features/show/slice';
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
}) => {
  const { t } = useTranslation();

  return (
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
            {isAuthorized ? t('show.authorized') : t('show.authorizeTheStart')}
          </Typography>
        }
        secondary={
          <Typography variant='body2' color='textSecondary'>
            {isAuthorized
              ? numUAVsTakingOffAutomatically <= 0
                ? t('show.revokeAuthorization')
                : numUAVsTakingOffAutomatically === 1
                  ? t('show.takeOffOne')
                  : t('show.takeOffMore', {
                      quantity: numUAVsTakingOffAutomatically,
                    })
              : t('show.authorizationReq')}
          </Typography>
        }
      />
    </ListItem>
  );
};

AuthorizationButton.propTypes = {
  isAuthorized: PropTypes.bool,
  numUAVsTakingOffAutomatically: PropTypes.number,
  status: PropTypes.oneOf(Object.values(Status)),
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
        dispatch(setCommandsAreBroadcast(true));
      }
    },
  }
)(AuthorizationButton);

import type { SxProps } from '@mui/material';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import { StatusLight } from '@skybrush/mui-components';

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
import type { AppDispatch, RootState } from '~/store/reducers';

const buttonStyle: SxProps<typeof ListItemButton> = {
  '&.Mui-selected': {
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
  },
};

type Props = Readonly<{
  isAuthorized: boolean;
  numUAVsTakingOffAutomatically: number;
  status: Status;
}>;

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
}: Props) => {
  const { t } = useTranslation();

  return (
    <ListItemButton
      /* disabled={!isAuthorized && status === Status.OFF} */
      selected={isAuthorized}
      sx={buttonStyle}
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
    </ListItemButton>
  );
};

export default connect(
  // mapStateToProps
  (state: RootState) => ({
    isAuthorized: isShowAuthorizedToStartLocally(state),
    numUAVsTakingOffAutomatically: countUAVsTakingOffAutomatically(state),
    status: getSetupStageStatuses(state).authorization,
  }),
  // mapDispatchToProps
  {
    onClick: () => (dispatch: AppDispatch, getState: () => RootState) => {
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

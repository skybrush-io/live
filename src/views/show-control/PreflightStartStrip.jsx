import CheckCircle from '@mui/icons-material/CheckCircle';
import RadioButtonUnchecked from '@mui/icons-material/RadioButtonUnchecked';
import SettingsRemote from '@mui/icons-material/SettingsRemote';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Typography from '@mui/material/Typography';
import PropTypes from 'prop-types';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import { makeStyles } from '@skybrush/app-theme-mui';

import ClockDisplayLabel from '~/components/ClockDisplayLabel';
import { Status } from '~/components/semantics';
import { getUAVIdsParticipatingInMission } from '~/features/mission/selectors';
import { setCommandsAreBroadcast } from '~/features/mission/slice';
import { hasManualPreflightChecks } from '~/features/preflight/selectors';
import { StartMethod } from '~/features/show/enums';
import {
  getShowStartMethod,
  getShowStartTimeAsString,
  hasScheduledStartTime,
  isShowAuthorizedToStartLocally,
} from '~/features/show/selectors';
import {
  openManualPreflightChecksDialog,
  openOnboardPreflightChecksDialog,
  openStartTimeDialog,
  setShowAuthorization,
  synchronizeShowSettings,
} from '~/features/show/slice';
import { getSetupStageStatuses } from '~/features/show/stages';
import { getUAVById } from '~/features/uavs/selectors';

const isAnyMissionUAVAirborne = (state) =>
  getUAVIdsParticipatingInMission(state).some((uavId) => {
    const ahl = getUAVById(state, uavId)?.position?.ahl;
    return typeof ahl === 'number' && Math.abs(ahl) >= 0.3;
  });

const useStyles = makeStyles((theme) => ({
  root: {
    display: 'grid',
    flex: '0 0 auto',
    gap: theme.spacing(1),
    gridTemplateColumns: 'minmax(0, 1.15fr) minmax(0, 0.85fr)',
    minWidth: 0,
    padding: theme.spacing(0.25, 1.25, 1),

    [theme.breakpoints.down('sm')]: {
      gridTemplateColumns: 'minmax(0, 1fr)',
    },
  },
  checklist: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(0.35),
    justifyContent: 'center',
    minWidth: 0,
    paddingTop: theme.spacing(0.25),
  },
  checkItem: {
    alignItems: 'flex-start',
    background: 'none',
    border: 'none',
    borderRadius: theme.spacing(0.75),
    color: 'inherit',
    cursor: 'pointer',
    display: 'flex',
    gap: theme.spacing(0.75),
    padding: theme.spacing(0.5, 0.25),
    textAlign: 'left',
    width: '100%',

    '&:disabled': {
      cursor: 'default',
      opacity: 0.45,
    },

    '&:hover:not(:disabled)': {
      backgroundColor: 'rgba(255,255,255,0.04)',
    },
  },
  checkIcon: {
    flexShrink: 0,
    fontSize: '1rem',
    marginTop: 1,
  },
  checkText: {
    display: 'flex',
    flexDirection: 'column',
    gap: 1,
    minWidth: 0,
  },
  checkPrimary: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 'clamp(0.62rem, 0.75vw, 0.68rem)',
    fontWeight: 600,
    lineHeight: 1.2,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  checkSecondary: {
    color: 'rgba(255,255,255,0.42)',
    fontSize: 'clamp(0.54rem, 0.65vw, 0.58rem)',
    lineHeight: 1.2,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  actions: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(0.625),
    justifyContent: 'center',
    minWidth: 0,
  },
  rcBox: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: theme.spacing(1),
    display: 'flex',
    gap: theme.spacing(0.75),
    padding: theme.spacing(0.875, 1),
  },
  rcIcon: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: '1.2rem',
  },
  rcText: {
    display: 'flex',
    flexDirection: 'column',
    gap: 1,
    minWidth: 0,
  },
  rcPrimary: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: '0.62rem',
    fontWeight: 600,
    lineHeight: 1.2,
  },
  rcSecondary: {
    color: 'rgba(255,255,255,0.42)',
    fontSize: '0.58rem',
    lineHeight: 1.2,
  },
  authorizeButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.07)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: theme.spacing(1),
    color: 'rgba(255,255,255,0.55)',
    display: 'flex',
    justifyContent: 'center',
    minHeight: 'clamp(44px, 5vh, 52px)',
    padding: theme.spacing(0.75, 1),
    textAlign: 'center',
    transition: theme.transitions.create(['background-color', 'border-color']),
    width: '100%',

    '&:hover': {
      backgroundColor: 'rgba(255,255,255,0.1)',
    },
  },
  authorizeButtonActive: {
    backgroundColor: 'rgba(62, 207, 110, 0.18)',
    borderColor: 'rgba(62, 207, 110, 0.45)',
    color: '#8ef0b0',
  },
  authorizeLabel: {
    fontSize: 'clamp(0.58rem, 0.72vw, 0.68rem)',
    fontWeight: 700,
    letterSpacing: '0.03em',
    lineHeight: 1.25,
    textTransform: 'uppercase',
  },
}));

const isDone = (status) =>
  status === Status.SUCCESS || status === Status.SKIPPED;

const PreflightStartStrip = ({
  authorizationStatus,
  formattedStartTime,
  hasManualChecks,
  hasScheduledStartTime,
  isAuthorized,
  manualStatus,
  onboardStatus,
  onAuthorizeToggle,
  onOpenManualChecks,
  onOpenOnboardChecks,
  onOpenStartTime,
  revocationDisabled,
  startMethod,
  startTimeStatus,
}) => {
  const classes = useStyles();
  const { t } = useTranslation();

  const startMethodLabel = useMemo(() => {
    switch (startMethod) {
      case StartMethod.RC:
        return t('show.startMethod.RC');
      case StartMethod.AUTO:
        return t('show.startMethod.AUTO');
      default:
        return t('show.unknownStartMode');
    }
  }, [startMethod, t]);

  const rcWaitingLabel =
    authorizationStatus === Status.WAITING
      ? t('bottomBar.waiting')
      : isAuthorized
        ? t('bottomBar.ready')
        : t('bottomBar.waiting');

  const authorizeLabel = isAuthorized
    ? t('show.authorized')
    : t('bottomBar.showStartPermissionRequired');

  return (
    <Box className={classes.root}>
      <Box className={classes.checklist}>
        <button
          className={classes.checkItem}
          disabled={onboardStatus === Status.OFF}
          onClick={onOpenOnboardChecks}
          type='button'
        >
          {isDone(onboardStatus) ? (
            <CheckCircle className={classes.checkIcon} sx={{ color: '#3ecf6e' }} />
          ) : (
            <RadioButtonUnchecked
              className={classes.checkIcon}
              sx={{ color: 'rgba(255,255,255,0.28)' }}
            />
          )}
          <Box className={classes.checkText}>
            <Typography className={classes.checkPrimary} component='span'>
              {t('bottomBar.aircraftPreflightCheck')}
            </Typography>
          </Box>
        </button>

        {hasManualChecks ? (
          <button
            className={classes.checkItem}
            disabled={manualStatus === Status.OFF}
            onClick={onOpenManualChecks}
            type='button'
          >
            {isDone(manualStatus) ? (
              <CheckCircle className={classes.checkIcon} sx={{ color: '#3ecf6e' }} />
            ) : (
              <RadioButtonUnchecked
                className={classes.checkIcon}
                sx={{ color: 'rgba(255,255,255,0.28)' }}
              />
            )}
            <Box className={classes.checkText}>
              <Typography className={classes.checkPrimary} component='span'>
                {t('bottomBar.manualPreflightCheck')}
              </Typography>
            </Box>
          </button>
        ) : null}

        <button
          className={classes.checkItem}
          onClick={onOpenStartTime}
          type='button'
        >
          {isDone(startTimeStatus) ? (
            <CheckCircle className={classes.checkIcon} sx={{ color: '#3ecf6e' }} />
          ) : (
            <RadioButtonUnchecked
              className={classes.checkIcon}
              sx={{ color: 'rgba(255,255,255,0.28)' }}
            />
          )}
          <Box className={classes.checkText}>
            <Typography className={classes.checkPrimary} component='span'>
              {t('bottomBar.selectStartTime')}
            </Typography>
            <Typography className={classes.checkSecondary} component='span'>
              {hasScheduledStartTime && formattedStartTime ? (
                <>
                  {t('show.startsAt', { time: formattedStartTime })}
                  {' · '}
                  <ClockDisplayLabel clockId='show' />
                </>
              ) : (
                t('show.chooseStartTimeNotSet')
              )}
            </Typography>
          </Box>
        </button>
      </Box>

      <Box className={classes.actions}>
        <Box className={classes.rcBox}>
          <SettingsRemote className={classes.rcIcon} />
          <Box className={classes.rcText}>
            <Typography className={classes.rcPrimary} component='span'>
              {startMethodLabel}
            </Typography>
            <Typography className={classes.rcSecondary} component='span'>
              {rcWaitingLabel}
            </Typography>
          </Box>
        </Box>

        <ButtonBase
          className={`${classes.authorizeButton} ${
            isAuthorized ? classes.authorizeButtonActive : ''
          }`}
          disabled={revocationDisabled && isAuthorized}
          onClick={onAuthorizeToggle}
        >
          <Typography className={classes.authorizeLabel} component='span'>
            {authorizeLabel}
          </Typography>
        </ButtonBase>
      </Box>
    </Box>
  );
};

PreflightStartStrip.propTypes = {
  authorizationStatus: PropTypes.string,
  formattedStartTime: PropTypes.string,
  hasManualChecks: PropTypes.bool,
  hasScheduledStartTime: PropTypes.bool,
  isAuthorized: PropTypes.bool,
  manualStatus: PropTypes.string,
  onboardStatus: PropTypes.string,
  onAuthorizeToggle: PropTypes.func,
  onOpenManualChecks: PropTypes.func,
  onOpenOnboardChecks: PropTypes.func,
  onOpenStartTime: PropTypes.func,
  revocationDisabled: PropTypes.bool,
  startMethod: PropTypes.string,
  startTimeStatus: PropTypes.string,
};

export default connect(
  (state) => ({
    authorizationStatus: getSetupStageStatuses(state).authorization,
    formattedStartTime: getShowStartTimeAsString(state),
    hasManualChecks: hasManualPreflightChecks(state),
    hasScheduledStartTime: hasScheduledStartTime(state),
    isAuthorized: isShowAuthorizedToStartLocally(state),
    manualStatus: getSetupStageStatuses(state).performManualPreflightChecks,
    onboardStatus: getSetupStageStatuses(state).waitForOnboardPreflightChecks,
    revocationDisabled:
      isShowAuthorizedToStartLocally(state) && isAnyMissionUAVAirborne(state),
    startMethod: getShowStartMethod(state),
    startTimeStatus: getSetupStageStatuses(state).setupStartTime,
  }),
  {
    onAuthorizeToggle:
      () => (dispatch, getState) => {
        const state = getState();
        const newAuthorizationState = !isShowAuthorizedToStartLocally(state);
        if (!newAuthorizationState && isAnyMissionUAVAirborne(state)) {
          return;
        }
        dispatch(setShowAuthorization(newAuthorizationState));
        dispatch(synchronizeShowSettings('toServer'));
        if (newAuthorizationState) {
          dispatch(setCommandsAreBroadcast(true));
        }
      },
    onOpenManualChecks: openManualPreflightChecksDialog,
    onOpenOnboardChecks: openOnboardPreflightChecksDialog,
    onOpenStartTime: openStartTimeDialog,
  }
)(PreflightStartStrip);

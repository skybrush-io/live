import PropTypes from 'prop-types';
import React from 'react';
import { withTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import { useAudio, useInterval, useMount } from 'react-use';

import NotificationsIcon from '@material-ui/icons/Notifications';
import NotificationsOffIcon from '@material-ui/icons/NotificationsOff';
import { makeStyles } from '@material-ui/core/styles';

import GenericHeaderButton from '@skybrush/mui-components/lib/GenericHeaderButton';
import SidebarBadge from '@skybrush/mui-components/lib/SidebarBadge';

import Colors from '~/components/colors';
import { acknowledgeOrToggleMuted } from '~/features/alert/actions';

import alertSoundResource from '~/../assets/sounds/alert.mp3';

const AUDIO_REPEAT_INTERVAL_SEC = 5;

const useStyles = makeStyles({
  bell: {
    animation: `$ring ${AUDIO_REPEAT_INTERVAL_SEC}s ease-in-out infinite`,
    transformOrigin: '50% 4px',
  },

  '@keyframes ring': {
    '0%': { transform: 'rotate(0)' },
    '2%': { transform: 'rotate(30deg)' },
    '5%': { transform: 'rotate(-28deg)' },
    '8%': { transform: 'rotate(34deg)' },
    '11%': { transform: 'rotate(-32deg)' },
    '14%': { transform: 'rotate(30deg)' },
    '17%': { transform: 'rotate(-28deg)' },
    '20%': { transform: 'rotate(26deg)' },
    '23%': { transform: 'rotate(-24deg)' },
    '26%': { transform: 'rotate(22deg)' },
    '29%': { transform: 'rotate(-20deg)' },
    '32%': { transform: 'rotate(18deg)' },
    '35%': { transform: 'rotate(-16deg)' },
    '38%': { transform: 'rotate(14deg)' },
    '41%': { transform: 'rotate(-12deg)' },
    '44%': { transform: 'rotate(10deg)' },
    '47%': { transform: 'rotate(-8deg)' },
    '50%': { transform: 'rotate(6deg)' },
    '53%': { transform: 'rotate(-4deg)' },
    '56%': { transform: 'rotate(2deg)' },
    '59%': { transform: 'rotate(-1deg)' },
    '62%': { transform: 'rotate(1deg)' },
    '65%': { transform: 'rotate(0)' },
    '100%': { transform: 'rotate(0)' },
  },
});

const AlertSound = () => {
  const [audio, state, controls] = useAudio(<audio src={alertSoundResource} />);

  // Trigger audio first when the component is mounted
  useMount(() => controls.play());

  // Also trigger audio every AUDIO_REPEAT_INTERVAL_SEC seconds
  useInterval(() => {
    if (!state.playing) {
      controls.play();
    }
  }, AUDIO_REPEAT_INTERVAL_SEC * 1000);

  return audio;
};

const AlertButton = ({ count, muted, t, ...rest }) => {
  const classes = useStyles();
  const hasAlerts = count > 0;

  return (
    <GenericHeaderButton
      {...rest}
      tooltip={
        muted
          ? t('alerts.muted')
          : hasAlerts
          ? t('alerts.acknowledgeAlerts')
          : t('alerts.clickToMute')
      }
    >
      {muted ? (
        <NotificationsOffIcon className={hasAlerts ? classes.bell : ''} />
      ) : (
        <NotificationsIcon className={hasAlerts ? classes.bell : ''} />
      )}
      <SidebarBadge visible={hasAlerts} color={Colors.error}>
        {count > 1 && (count >= 10 ? '9+' : String(count))}
      </SidebarBadge>
      {!muted && hasAlerts && <AlertSound />}
    </GenericHeaderButton>
  );
};

AlertButton.propTypes = {
  count: PropTypes.number,
  muted: PropTypes.bool,
  t: PropTypes.func,
};

export default connect(
  // mapStateToProps
  (state) => state.alert,
  // mapDispatchToProps
  {
    onClick: acknowledgeOrToggleMuted,
  }
)(withTranslation()(AlertButton));

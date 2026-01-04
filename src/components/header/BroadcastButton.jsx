import { styled } from '@mui/material/styles';
import { keyframes } from '@mui/styled-engine';
import PropTypes from 'prop-types';
import React, { useEffect, useRef } from 'react';
import { withTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import {
  GenericHeaderButton,
  SidebarBadge,
  Tooltip,
} from '@skybrush/mui-components';

import Colors from '~/components/colors';
import { isBroadcast } from '~/features/session/selectors';
import { setBroadcast } from '~/features/session/slice';
import Campaign from '~/icons/Campaign';

const isValidTimeoutLength = (value) => typeof value === 'number' && value > 0;

const cooldownKeyframes = keyframes({
  from: {
    height: '100%',
  },
  to: {
    height: '0%',
  },
});

const Underlay = styled('div')(({ active, timeoutLength }) => ({
  position: 'absolute',
  right: '0px',
  bottom: '0px',
  left: '0px',

  height: '0%',

  backgroundColor: Colors.warning,
  opacity: 0.5,

  animationName: active ? cooldownKeyframes : null,
  animationDuration:
    isValidTimeoutLength(timeoutLength) && Number.isFinite(timeoutLength)
      ? `${timeoutLength}s`
      : '100000s',
  animationTimingFunction: 'linear',
  animationIterationCount: '1',
}));

const BroadcastButton = ({ isBroadcast, setBroadcast, t, timeoutLength }) => {
  const timeout = useRef(undefined);

  useEffect(() => {
    if (isBroadcast && isValidTimeoutLength(timeoutLength)) {
      timeout.current = setTimeout(() => {
        setBroadcast(false);
      }, timeoutLength * 1000);
    } else if (!isBroadcast && timeout.current) {
      clearTimeout(timeout.current);
      timeout.current = undefined;
    }
  }, [isBroadcast, setBroadcast, timeoutLength]);

  return (
    <Tooltip
      content={
        isBroadcast
          ? t('broadcastButton.disable')
          : t('broadcastButton.enable', { time: timeoutLength })
      }
    >
      <GenericHeaderButton onClick={() => setBroadcast(!isBroadcast)}>
        <Underlay active={isBroadcast} timeoutLength={timeoutLength} />
        <SidebarBadge color={Colors.warning} visible={isBroadcast} />
        <div style={{ position: 'relative' }}>
          <Campaign />
        </div>
      </GenericHeaderButton>
    </Tooltip>
  );
};

BroadcastButton.propTypes = {
  isBroadcast: PropTypes.bool,
  setBroadcast: PropTypes.func,
  t: PropTypes.func,
  timeoutLength: PropTypes.number,
};

export default connect(
  // mapStateToProps
  (state) => ({
    isBroadcast: isBroadcast(state),
  }),
  // mapDispatchToProps
  {
    setBroadcast,
  }
)(withTranslation()(BroadcastButton));

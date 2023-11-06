import clsx from 'clsx';
import PropTypes from 'prop-types';
import React, { useEffect, useRef } from 'react';
import { withTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import { makeStyles } from '@material-ui/core/styles';
import GenericHeaderButton from '@skybrush/mui-components/lib/GenericHeaderButton';
import SidebarBadge from '@skybrush/mui-components/lib/SidebarBadge';

import Tooltip from '@skybrush/mui-components/lib/Tooltip';

import Colors from '~/components/colors';
import { setBroadcast } from '~/features/session/slice';
import { isBroadcast } from '~/features/session/selectors';
import Campaign from '~/icons/Campaign';

const isValidTimeoutLength = (value) => typeof value === 'number' && value > 0;

const useStyles = makeStyles({
  underlay: {
    position: 'absolute',
    right: '0px',
    bottom: '0px',
    left: '0px',

    height: '0%',

    backgroundColor: Colors.warning,
    opacity: 0.5,
  },

  underlayActive: {
    animationName: '$cooldown',
    animationDuration: ({ timeoutLength }) =>
      isValidTimeoutLength(timeoutLength) && Number.isFinite(timeoutLength)
        ? `${timeoutLength}s`
        : '100000s',
    animationTimingFunction: 'linear',
    animationIterationCount: '1',
  },

  iconWrapper: {
    position: 'relative',
  },

  '@keyframes cooldown': {
    '0%': {
      height: '100%',
    },
    '100%': {
      height: '0%',
    },
  },
});

const BroadcastButton = ({ isBroadcast, setBroadcast, t, timeoutLength }) => {
  const classes = useStyles({ timeoutLength });
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

    // return timeout
    //   ? () => {
    //       setBroadcast(false);
    //       clearTimeout(timeout);
    //     }
    //   : null;
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
        <div
          className={clsx(
            classes.underlay,
            isBroadcast && classes.underlayActive
          )}
        />
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

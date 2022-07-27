import clsx from 'clsx';
import PropTypes from 'prop-types';
import React, { useEffect, useRef } from 'react';
import { connect } from 'react-redux';

import { makeStyles } from '@material-ui/core/styles';
import GenericHeaderButton from '@skybrush/mui-components/lib/GenericHeaderButton';
import Tooltip from '@skybrush/mui-components/lib/Tooltip';

import { setBroadcast } from '~/features/session/slice';
import { isBroadcast } from '~/features/session/selectors';
import Campaign from '~/icons/Campaign';

const isValidTimeoutLength = (value) => typeof value === 'number' && value > 0;

const useStyles = makeStyles((theme) => ({
  underlay: {
    position: 'absolute',
    right: '0px',
    bottom: '0px',
    left: '0px',

    height: '0%',

    backgroundColor: theme.palette.warning.main,
    opacity: 0.5,
  },

  'underlay-active': {
    animationName: '$cooldown',
    animationDuration: ({ timeoutLength }) =>
      isValidTimeoutLength(timeoutLength) && Number.isFinite(timeoutLength)
        ? `${timeoutLength}s`
        : '100000s',
    animationTimingFunction: 'linear',
    animationIterationCount: 'infinite',
  },

  '@keyframes cooldown': {
    '0%': {
      height: '100%',
    },
    '100%': {
      height: '0%',
    },
  },
}));

const BroadcastButton = ({ isBroadcast, setBroadcast, timeoutLength }) => {
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
          ? `Disable broadcast`
          : `Enable broadcast for ${timeoutLength} seconds`
      }
    >
      <GenericHeaderButton onClick={() => setBroadcast(!isBroadcast)}>
        <div
          className={clsx(classes.underlay, {
            [classes['underlay-active']]: isBroadcast,
          })}
        />
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
)(BroadcastButton);

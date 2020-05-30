import clsx from 'clsx';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { createSelector } from '@reduxjs/toolkit';

import Box from '@material-ui/core/Box';
import { makeStyles } from '@material-ui/core/styles';

import StatusLight from '~/components/StatusLight';
import LazyTooltip from '~/components/LazyTooltip';
import { Status } from '~/components/semantics';

import { getSingleUAVStatusLevel } from '~/features/uavs/selectors';

import UAVStatusMiniList from './UAVStatusMiniList';

/* ************************************************************************ */

/**
 * Component-specific selector that summarizes the state of all UAVs in four
 * numbers: operational, initializing, warning and error. Certain UAV status
 * levels such as "rth" and "critical" are consolidated into "warning" and
 * "error", respectively.
 */
const getStatusSummary = createSelector(
  (state) => state.uavs.byId,
  (state) => state.uavs.order,
  (byId, order) => {
    const result = [0, 0, 0, 0];

    for (const uavId of order) {
      const uav = byId[uavId];
      if (uav) {
        const level = getSingleUAVStatusLevel(uav);
        switch (level) {
          case Status.CRITICAL:
          case Status.ERROR:
            result[3] += 1;
            break;

          case Status.GONE:
            /* excluded from counts */
            break;

          case Status.SUCCESS:
            result[0] += 1;
            break;

          case Status.INFO:
            result[1] += 1;
            break;

          default:
            result[2] += 1;
        }
      }
    }

    return result;
  }
);

/* ************************************************************************ */

const useStyles = makeStyles(
  (theme) => ({
    root: {
      fontSize: '1rem',
    },

    inner: {
      alignItems: 'center',
      display: 'flex',
      height: '100%',
      marginRight: theme.spacing(-1.5),
      padding: theme.spacing(1),
    },

    counter: {
      padding: theme.spacing(0, 1.5, 0, 0.5),
      userSelect: 'none',
    },

    off: {
      opacity: 0.5,
    },
  }),
  {
    name: 'UAVStatusSummary',
  }
);

const statusOrder = [Status.SUCCESS, Status.INFO, Status.WARNING, Status.ERROR];

const UAVStatusSummary = ({ counts }) => {
  const classes = useStyles();

  return (
    <LazyTooltip content={<UAVStatusMiniList />}>
      <Box className={clsx(classes.root, 'wb-module')}>
        <div className={classes.inner}>
          {statusOrder.map((statusCode, index) => (
            <React.Fragment key={statusCode}>
              <StatusLight
                inline
                status={counts[index] > 0 ? statusCode : Status.OFF}
              />
              <div
                className={clsx(
                  classes.counter,
                  counts[index] <= 0 && classes.off
                )}
              >
                {counts[index]}
              </div>
            </React.Fragment>
          ))}
        </div>
      </Box>
    </LazyTooltip>
  );
};

UAVStatusSummary.propTypes = {
  counts: PropTypes.arrayOf(PropTypes.number),
};

export default connect(
  // mapStateToProps
  (state) => ({
    counts: getStatusSummary(state),
  }),
  // mapDispatchToProps
  null
)(UAVStatusSummary);

import Sum from '@mui/icons-material/Functions';
import Box, { type BoxProps } from '@mui/material/Box';
import Button from '@mui/material/Button';
import { createSelector } from '@reduxjs/toolkit';
import clsx from 'clsx';
import React, { useContext } from 'react';
import { connect } from 'react-redux';

import { makeStyles } from '@skybrush/app-theme-mui';
import { LazyTooltip, StatusLight } from '@skybrush/mui-components';

import { Status } from '~/components/semantics';
import { selectAllUAVs } from '~/features/selection/slice';
import { showWarning } from '~/features/snackbar/actions';
import {
  getSingleUAVStatusLevel,
  getUAVIdList,
  getUAVIdToStateMapping,
} from '~/features/uavs/selectors';
import type { RootState } from '~/store/reducers';
import { createShallowSelector } from '~/utils/selectors';
import { Workbench } from '~/workbench';

import UAVStatusMiniList from './UAVStatusMiniList';

/* ************************************************************************ */

/**
 * Component-specific selector that summarizes the state of all UAVs in four
 * numbers: operational, initializing, warning and error. Certain UAV status
 * levels such as "rth" and "critical" are consolidated into "warning" and
 * "error", respectively.
 */
const getStatusSummaryInner = createSelector(
  getUAVIdToStateMapping,
  getUAVIdList,
  (byId, order) => {
    const result: [number, number, number, number, number, number] = [
      0, 0, 0, 0, 0, 0,
    ];

    for (const uavId of order) {
      const uav = byId[uavId];
      if (uav) {
        const level = getSingleUAVStatusLevel(uav);
        switch (level) {
          case Status.SUCCESS:
            result[0] += 1;
            break;

          case Status.INFO:
            result[1] += 1;
            break;

          case Status.WARNING:
            result[2] += 1;
            break;

          case Status.MISSING:
            result[3] += 1;
            break;

          case Status.CRITICAL:
          case Status.ERROR:
            result[4] += 1;
            break;

          case Status.OFF:
            /* excluded from counts */
            break;

          default:
            /* unknown status, excluded from counts */
            break;
        }
      }
    }

    result[5] = result[0] + result[1] + result[2] + result[3] + result[4];

    return result;
  }
);

/**
 * Wrapper of `getStatusSummaryInner()` to prevent a re-rendering when the
 * status summary result did not change.
 */
const getStatusSummary = createShallowSelector(
  getStatusSummaryInner,
  (result) => result
);

/* ************************************************************************ */

const useStyles = makeStyles((theme) => ({
  root: {
    fontSize: '1rem',
    cursor: 'pointer',
  },

  inner: {
    alignItems: 'center',
    display: 'flex',
    gap: theme.spacing(1),
    height: '100%',
    padding: theme.spacing(0, 1),
  },

  counter: {
    padding: theme.spacing(0, 0.5),
    userSelect: 'none',
    fontVariantNumeric: 'tabular-nums',
  },

  off: {
    opacity: 0.5,
  },

  statusLight: {
    display: 'flex',
    alignItems: 'center',
    flexDirection: 'row',
  },

  button: {
    display: 'flex',
    flexDirection: 'row',
    fontSize: '1rem',
    fontWeight: 'normal',
    paddingLeft: 0,
    paddingRight: 0,
    minWidth: 48,
    textShadow: '0 1px 2px rgba(0, 0, 0, 0.65)' /* copied from .wb-module */,

    '&:hover': {
      boxShadow: theme.shadows[2],
    },
  },
}));

const statusOrder: Array<Status | null> = [
  Status.SUCCESS,
  Status.INFO,
  Status.WARNING,
  Status.MISSING,
  Status.ERROR,
  null,
];

type UAVStatusSummaryProps = {
  counts: number[];
  selectAllUAVs: () => void;
} & Omit<BoxProps, 'children'>;

const UAVStatusSummary = ({
  counts,
  selectAllUAVs,
  ...rest
}: UAVStatusSummaryProps) => {
  const classes = useStyles();
  const workbench = useContext(Workbench);

  return (
    <LazyTooltip interactive content={<UAVStatusMiniList />}>
      <Box
        className={clsx(classes.root, 'wb-module')}
        onClick={() => {
          if (!workbench.bringToFront('uavList')) {
            showWarning('UAVs panel is not added to the workbench yet');
          }
        }}
        {...rest}
      >
        <div className={classes.inner}>
          {statusOrder.map((statusCode, index) => {
            const content = (
              <React.Fragment>
                {statusCode !== null ? (
                  <StatusLight
                    inline
                    status={counts[index] > 0 ? statusCode : Status.OFF}
                  />
                ) : (
                  <Sum />
                )}
                <div
                  className={clsx(
                    classes.counter,
                    counts[index] <= 0 && classes.off
                  )}
                >
                  {counts[index]}
                </div>
              </React.Fragment>
            );

            return statusCode === null ? (
              <Button
                key='total'
                className={classes.button}
                onClick={() => selectAllUAVs()}
              >
                {content}
              </Button>
            ) : (
              <div key={statusCode.toString()} className={classes.statusLight}>
                {content}
              </div>
            );
          })}
        </div>
      </Box>
    </LazyTooltip>
  );
};

const ConnectedUAVStatusSummary = connect(
  // mapStateToProps
  (state: RootState) => ({
    counts: getStatusSummary(state),
  }),
  // mapDispatchToProps
  (dispatch) => ({
    selectAllUAVs: () => dispatch(selectAllUAVs()),
  })
)(UAVStatusSummary);

export default ConnectedUAVStatusSummary;

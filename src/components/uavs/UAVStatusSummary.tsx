import Box, { type BoxProps } from '@mui/material/Box';
import clsx from 'clsx';
import { use } from 'react';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import { makeStyles } from '@skybrush/app-theme-mui';
import { LazyTooltip } from '@skybrush/mui-components';

import { Status } from '~/components/semantics';
import { selectAllUAVs } from '~/features/selection/slice';
import { showWarning } from '~/features/snackbar/actions';
import {
  getSingleUAVStatusLevel,
  getUAVIdList,
  getUAVIdToStateMapping,
} from '~/features/uavs/selectors';
import type { RootState } from '~/store/reducers';
import { createDeepResultSelector } from '~/utils/selectors';
import { WorkbenchContext } from '~/workbench';

import PinnableTooltipContents from '../header/PinnableTooltipContents';
import UAVStatusMiniList from './UAVStatusMiniList';
import UAVStatusSummaryLight from './UAVStatusSummaryLight';
import UAVStatusSummaryTotal from './UAVStatusSummaryTotal';

/* ************************************************************************ */

/**
 * Component-specific selector that summarizes the state of all UAVs in four
 * numbers: operational, initializing, warning and error. Certain UAV status
 * levels such as "rth" and "critical" are consolidated into "warning" and
 * "error", respectively.
 *
 * The result of the output function is compared with the previous result using
 * deep equality. This is to prevent a re-render when the UAV statuses change but the
 * summary remains identical.
 */
const getStatusSummary = createDeepResultSelector(
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

/* ************************************************************************ */

const useStyles = makeStyles((theme) => ({
  root: {
    cursor: 'pointer',
  },

  inner: {
    alignItems: 'center',
    display: 'flex',
    gap: theme.spacing(1),
    height: '100%',
    padding: theme.spacing(0, 1),
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
  const workbench = use(WorkbenchContext);
  const { t } = useTranslation();

  return (
    <LazyTooltip
      interactive
      content={
        <PinnableTooltipContents component='uav-status-mini-list'>
          <UAVStatusMiniList />
        </PinnableTooltipContents>
      }
    >
      <Box
        className={clsx(classes.root, 'wb-module')}
        onClick={() => {
          if (!workbench.bringToFront('uavList')) {
            showWarning(t('UAVStatus.error.notInWorkbench'));
          }
        }}
        {...rest}
      >
        <div className={classes.inner}>
          {statusOrder.map((statusCode, index) =>
            statusCode === null ? (
              <UAVStatusSummaryTotal
                key='total'
                count={counts[index]}
                onSelectAll={selectAllUAVs}
              />
            ) : (
              <UAVStatusSummaryLight
                key={statusCode.toString()}
                count={counts[index]}
                statusCode={statusCode}
              />
            )
          )}
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

import clsx from 'clsx';
import isNil from 'lodash-es/isNil';
import padEnd from 'lodash-es/padEnd';
import padStart from 'lodash-es/padStart';
import { connect } from 'react-redux';

import { makeStyles, monospacedFont, Status } from '@skybrush/app-theme-mui';
import type { Vector3Tuple } from '@skybrush/math';
import { StatusPill, StatusText } from '@skybrush/mui-components';

import type { BatteryFormatter } from '~/components/battery';
import BatteryIndicator from '~/components/BatteryIndicator';
import ColoredLight from '~/components/ColoredLight';
import { getBatteryFormatter } from '~/features/settings/selectors';
import {
  createSingleUAVStatusSummarySelector,
  getDeviationFromTakeoffHeadingByUavId,
  getLightColorByUavIdInCSSNotation,
  getUAVById,
} from '~/features/uavs/selectors';
import { NULL_ISLAND, type GPSFix, type GPSPosition } from '~/model/geography';
import { UAVAge } from '~/model/uav';
import {
  getPreferredCoordinateFormatter,
  type CoordinatePairFormatter,
} from '~/selectors/formatting';
import type { RootState } from '~/store/reducers';
import { formatCoordinateArray } from '~/utils/formatting';

import { GPSFixType } from '~/model/enums';
import FlightModeStatusPill from './FlightModeStatusPill';
import GPSStatusPill from './GPSStatusPill';
import RSSIIndicator from './RSSIIndicator';

type DroneStatusLineOwnProps = Partial<{
  id: string;
  label: string;
  secondaryLabel: string;
  editing: boolean;
}>;

type DroneStatusLineCalculatedProps = Partial<{
  age: UAVAge;
  batteryFormatter: BatteryFormatter;
  batteryStatus: Record<string, any>;
  color: string;
  coordinateFormatter: CoordinatePairFormatter;
  debugString: string;
  details: string;
  gone: boolean;
  gpsFix: GPSFix;
  heading: number;
  headingDeviation: number;
  localPosition: Vector3Tuple;
  missing: boolean;
  mode: string;
  position: GPSPosition;
  rssi: number[];
  text: string;
  textSemantics: Status;
}>;

type DroneStatusLineProps = DroneStatusLineOwnProps &
  DroneStatusLineCalculatedProps;

/**
 * Converts the absolute value of a heading deviation, in degrees, to the
 * corresponding semantic status that should be used to color the heading info
 * in the status line.
 */
const headingDeviationToStatus = (deviation?: number): Status => {
  const absDeviation = deviation ? Math.abs(deviation) : 0;
  if (absDeviation >= 20) {
    return Status.ERROR;
  }

  if (absDeviation >= 10) {
    return Status.WARNING;
  }

  return Status.OFF;
};

const localCoordinateFormatter = formatCoordinateArray;

const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
    fontFamily: monospacedFont,
    fontSize: 'small',
    fontVariantNumeric: 'lining-nums tabular-nums',
    userSelect: 'none',
    whiteSpace: 'pre',
  },
  gone: {
    opacity: 0.7,
  },
  muted: {
    color: theme.palette.text.disabled,
  },
  pill: {
    margin: theme.spacing(0, 0.5),
    verticalAlign: 'text-top',
    transform: 'translateY(-1px)',
  },
  statusPill: {
    width: 80,
  },
  modePill: {
    width: 48,
  },
  gpsPill: {
    width: 40,
    outline: 'none !important',
  },
  rssiPills: {
    width: 72,
    paddingLeft: 2,
  },
  batteryIndicator: {
    display: 'inline-block',
    fontFamily: theme.typography.fontFamily,
    textAlign: 'left',
    padding: theme.spacing(0, 0.5),
    margin: theme.spacing(0, 0.5),
    width: '56px !important',
  },
}));

/**
 * Status line in the drone list view that represents a single drone.
 */
const DroneStatusLine = ({
  age,
  batteryFormatter,
  batteryStatus,
  color,
  coordinateFormatter,
  debugString,
  details,
  heading,
  headingDeviation,
  gone,
  gpsFix,
  label = '',
  localPosition,
  missing,
  mode,
  position = NULL_ISLAND,
  rssi = [],
  secondaryLabel = '',
  text,
  textSemantics = Status.INFO,
}: DroneStatusLineProps) => {
  const classes = useStyles();
  const { amsl, ahl, agl } = position;
  return (
    <div className={clsx(classes.root, gone && classes.gone)}>
      {padStart(label, 5)}
      <span className={classes.muted}>{padStart(secondaryLabel, 5)}</span>
      {(details || text) && (
        <StatusPill
          inline
          className={clsx(classes.pill, classes.statusPill)}
          status={textSemantics}
          hollow={age === UAVAge.GONE}
        >
          {details || text}
        </StatusPill>
      )}
      {!missing && (
        <>
          <FlightModeStatusPill
            mode={mode}
            className={clsx(classes.pill, classes.modePill)}
          />
          <BatteryIndicator
            className={classes.batteryIndicator}
            formatter={batteryFormatter}
            {...batteryStatus}
          />
          <ColoredLight inline color={color} />
          <RSSIIndicator className={classes.rssiPills} rssi={rssi} />
          <GPSStatusPill
            className={clsx(classes.pill, classes.gpsPill)}
            fixType={gpsFix?.type ?? GPSFixType.UNKNOWN}
          />
          {localPosition ? (
            padEnd(localCoordinateFormatter(localPosition), 25)
          ) : position ? (
            padEnd(
              coordinateFormatter?.([position.lon ?? 0, position.lat ?? 0]) ??
                '',
              25
            )
          ) : (
            <span className={classes.muted}>{padEnd('no position', 25)}</span>
          )}
          {!isNil(amsl) ? (
            padStart(amsl.toFixed(1), 6) + 'm'
          ) : (
            <span className={classes.muted}>{'    ———'}</span>
          )}
          {!isNil(ahl) ? (
            padStart(ahl.toFixed(1), 6) + 'm'
          ) : (
            <span className={classes.muted}>{'    ———'}</span>
          )}
          {!isNil(agl) ? (
            padStart(agl.toFixed(1), 5) + 'm'
          ) : (
            <span className={classes.muted}>{'   ———'}</span>
          )}
          <StatusText status={headingDeviationToStatus(headingDeviation)}>
            {padStart(!isNil(heading) ? Math.round(heading) + '°' : '', 5)}
          </StatusText>
          <span>{debugString ? ' ' + debugString : ''}</span>
        </>
      )}
    </div>
  );
};

export default connect(
  // mapStateToProps
  () => {
    const statusSummarySelector = createSingleUAVStatusSummarySelector();
    return (
      state: RootState,
      { id: uavId }: DroneStatusLineOwnProps
    ): DroneStatusLineCalculatedProps => {
      if (!uavId) {
        return {
          missing: true,
        };
      }

      const uav = getUAVById(state, uavId);
      if (!uav) {
        return {
          missing: true,
        };
      }

      const {
        debugString,
        gpsFix,
        heading,
        localPosition,
        mode,
        position,
        rssi,
      } = uav;
      const headingDeviation = getDeviationFromTakeoffHeadingByUavId(
        state,
        uavId
      );
      const color = getLightColorByUavIdInCSSNotation(state, uavId);
      return {
        batteryFormatter: getBatteryFormatter(state),
        color,
        coordinateFormatter: getPreferredCoordinateFormatter(state),
        debugString,
        gpsFix,
        heading,
        headingDeviation,
        localPosition,
        mode,
        position,
        rssi,
        ...statusSummarySelector(state, uavId),
      };
    };
  }
)(DroneStatusLine);

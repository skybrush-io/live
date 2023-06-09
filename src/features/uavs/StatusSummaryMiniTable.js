import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import TimeAgo from 'react-timeago';

import { makeStyles } from '@material-ui/core/styles';

import StatusText from '@skybrush/mui-components/lib/StatusText';

import {
  abbreviateGPSFixType,
  getFlightModeLabel,
  getSemanticsForFlightMode,
  getSemanticsForGPSFixType,
} from '~/model/enums';
import CustomPropTypes from '~/utils/prop-types';
import { formatNumberSafely, shortTimeAgoFormatter } from '~/utils/formatting';

import { getUAVById } from './selectors';

const useStyles = makeStyles(
  (theme) => ({
    root: {
      fontSize: 'small',
      width: '100%',

      '& .muted': {
        color: theme.palette.text.disabled,
      },
    },

    header: {
      textTransform: 'uppercase',
      color: theme.palette.text.secondary,
    },

    value: {
      textAlign: 'right',
    },

    separator: {},
  }),
  {
    name: 'StatusSummaryMiniTable',
  }
);

const naText = <span className='muted'>—</span>;

// TODO(ntamas): refactor this in terms of components/mini-table!

const StatusSummaryMiniTable = ({
  gpsFix,
  heading,
  lastUpdated,
  localPosition,
  mode,
  position,
}) => {
  const classes = useStyles();
  const { lat, lon, amsl, ahl, agl } = position || {};
  const hasLocalPosition = localPosition && Array.isArray(localPosition);
  const flightModeLabel = mode ? (
    <StatusText status={getSemanticsForFlightMode(mode)}>
      {getFlightModeLabel(mode)}
    </StatusText>
  ) : (
    naText
  );
  const gpsFixType = gpsFix?.type;
  const shouldShowGlobalPositionInfo = !hasLocalPosition || gpsFixType;

  const rows = [['Mode', flightModeLabel], 'sep0'];

  if (shouldShowGlobalPositionInfo) {
    const gpsFixLabel = gpsFixType ? (
      <>
        <StatusText status={getSemanticsForGPSFixType(gpsFixType)}>
          {abbreviateGPSFixType(gpsFixType)}
        </StatusText>
        {gpsFix?.numSatellites && ` (${gpsFix?.numSatellites} sats)`}
      </>
    ) : (
      naText
    );

    const gpsAcc = (
      <>
        {formatNumberSafely(gpsFix?.horizontalAccuracy, 2, '', naText)}
        {' / '}
        {formatNumberSafely(gpsFix?.verticalAccuracy, 2, '', naText)}
        {' m'}
      </>
    );

    rows.push(
      ['GPS fix', gpsFixLabel],
      ['GPS acc', gpsAcc],
      'sep1',
      ['Lat', formatNumberSafely(lat, 7, '°', naText)],
      ['Lon', formatNumberSafely(lon, 7, '°', naText)],
      ['AMSL', formatNumberSafely(amsl, 2, ' m', naText)],
      ['AHL', formatNumberSafely(ahl, 2, ' m', naText)],
      ['AGL', formatNumberSafely(agl, 2, ' m', naText)],
      'sep2'
    );
  }

  if (hasLocalPosition) {
    rows.push(
      ['X', formatNumberSafely(localPosition[0], 2, ' m', naText)],
      ['Y', formatNumberSafely(localPosition[1], 2, ' m', naText)],
      ['Z', formatNumberSafely(localPosition[2], 2, ' m', naText)]
    );
  }

  rows.push(['Heading', formatNumberSafely(heading, 1, '°', naText)], 'sep3', [
    'Last seen',
    lastUpdated ? (
      <TimeAgo formatter={shortTimeAgoFormatter} date={lastUpdated} />
    ) : (
      naText
    ),
  ]);

  return (
    <table className={classes.root}>
      <tbody>
        {rows.map((row) =>
          Array.isArray(row) ? (
            <tr key={row[0]}>
              <td className={classes.header}>{row[0]}</td>
              <td className={classes.value}>{row[1]}</td>
            </tr>
          ) : (
            <tr key={row}>
              <td className={classes.separator} colSpan={2} />
            </tr>
          )
        )}
      </tbody>
    </table>
  );
};

StatusSummaryMiniTable.propTypes = {
  gpsFix: PropTypes.shape({
    type: PropTypes.number,
    numSatellites: PropTypes.number,
    horizontalAccuracy: PropTypes.number,
    verticalAccuracy: PropTypes.number,
  }),
  heading: PropTypes.number,
  lastUpdated: PropTypes.number,
  localPosition: CustomPropTypes.localCoordinate,
  mode: PropTypes.string,
  position: PropTypes.shape({
    lat: PropTypes.number,
    lon: PropTypes.number,
    amsl: PropTypes.number,
    ahl: PropTypes.number,
    agl: PropTypes.number,
  }),
};

export default connect(
  // mapStateToProps
  (state, ownProps) => getUAVById(state, ownProps.uavId),

  // mapDispatchToProps
  {}
)(StatusSummaryMiniTable);

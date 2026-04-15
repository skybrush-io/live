import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import TimeAgo from 'react-timeago';

import { StatusText } from '@skybrush/mui-components';

import MiniTable, { naText } from '~/components/MiniTable';
import {
  abbreviateGPSFixType,
  getFlightModeLabel,
  getSemanticsForFlightMode,
  getSemanticsForGPSFixType,
  getSemanticsForRSSI,
} from '~/model/enums';
import {
  formatNumberSafely,
  formatRSSI,
  shortTimeAgoFormatter,
} from '~/utils/formatting';

import { getUAVById } from './selectors';

const StatusSummaryMiniTable = ({
  gpsFix,
  heading,
  lastUpdated,
  localPosition,
  mode,
  position,
  rssi,
}) => {
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

    let { horizontalAccuracy, verticalAccuracy } = gpsFix || {};

    if (typeof horizontalAccuracy === 'number' && horizontalAccuracy > 50) {
      horizontalAccuracy = '50+';
    } else {
      horizontalAccuracy = formatNumberSafely(
        horizontalAccuracy,
        2,
        '',
        naText
      );
    }

    if (typeof verticalAccuracy === 'number' && verticalAccuracy > 50) {
      verticalAccuracy = '50+';
    } else {
      verticalAccuracy = formatNumberSafely(verticalAccuracy, 2, '', naText);
    }

    const gpsAcc = (
      <>
        {horizontalAccuracy}
        {' / '}
        {verticalAccuracy}
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

  const rssiLabels = [];

  if (rssi && Array.isArray(rssi) && rssi.length > 0) {
    for (const rssiValue of rssi) {
      rssiLabels.push(
        <StatusText status={getSemanticsForRSSI(rssiValue)}>
          {formatRSSI(rssiValue)}
        </StatusText>,
        ' / '
      );
    }

    rssiLabels.pop();
  } else {
    rssiLabels.push(naText);
  }

  rows.push(
    ['Heading', formatNumberSafely(heading, 1, '°', naText)],
    'sep3',
    ['RSSI', rssiLabels],
    'sep4',
    [
      'Last seen',
      lastUpdated ? (
        <TimeAgo formatter={shortTimeAgoFormatter} date={lastUpdated} />
      ) : (
        naText
      ),
    ]
  );

  return <MiniTable items={rows} />;
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
  localPosition: PropTypes.arrayOf(PropTypes.number),
  mode: PropTypes.string,
  position: PropTypes.shape({
    lat: PropTypes.number,
    lon: PropTypes.number,
    amsl: PropTypes.number,
    ahl: PropTypes.number,
    agl: PropTypes.number,
  }),
  rssi: PropTypes.arrayOf(PropTypes.number),
};

export default connect(
  // mapStateToProps
  (state, ownProps) => getUAVById(state, ownProps.uavId),

  // mapDispatchToProps
  {}
)(StatusSummaryMiniTable);

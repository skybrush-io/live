import type React from 'react';
import { connect } from 'react-redux';
import TimeAgo from 'react-timeago';

import { Status } from '@skybrush/app-theme-mui';
import { StatusText } from '@skybrush/mui-components';

import MiniTable, { naText, type MiniTableItem } from '~/components/MiniTable';
import {
  abbreviateGPSFixType,
  getFlightModeLabel,
  getSemanticsForFlightMode,
  getSemanticsForGPSFixType,
  getSemanticsForRSSI,
} from '~/model/enums';
import type { RootState } from '~/store/reducers';
import {
  formatNumberSafely,
  formatRSSI,
  shortTimeAgoFormatter,
} from '~/utils/formatting';

import { getUAVById } from './selectors';
import type { StoredUAV } from './types';

type StatusSummaryMiniTableOwnProps = { uavId?: string };
type StatusSummaryMiniTableStatProps = Partial<StoredUAV>;
type StatusSummaryMiniTableProps = StatusSummaryMiniTableOwnProps &
  StatusSummaryMiniTableStatProps;

const StatusSummaryMiniTable = ({
  gpsFix,
  heading,
  lastUpdated,
  localPosition,
  mode,
  position,
  rssi,
}: StatusSummaryMiniTableProps) => {
  const { lat, lon, amsl, ahl, agl } = position || {};
  const hasLocalPosition = localPosition && Array.isArray(localPosition);
  const flightModeLabel = mode ? (
    <StatusText status={getSemanticsForFlightMode(mode) ?? Status.WARNING}>
      {getFlightModeLabel(mode)}
    </StatusText>
  ) : (
    naText
  );
  const gpsFixType = gpsFix?.type;
  const shouldShowGlobalPositionInfo = !hasLocalPosition || gpsFixType;

  const rows: MiniTableItem[] = [['Mode', flightModeLabel], 'sep0'];

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

    let horizontalAccuracy: number | React.ReactNode =
      gpsFix?.horizontalAccuracy;
    let verticalAccuracy: number | React.ReactNode = gpsFix?.verticalAccuracy;

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

  const rssiLabels: React.ReactNode[] = [];

  if (rssi && Array.isArray(rssi) && rssi.length > 0) {
    for (const [index, rssiValue] of Object.entries(rssi)) {
      rssiLabels.push(
        <StatusText key={index} status={getSemanticsForRSSI(rssiValue)}>
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
        <TimeAgo
          key='lastSeen'
          formatter={shortTimeAgoFormatter}
          date={lastUpdated}
        />
      ) : (
        naText
      ),
    ]
  );

  return <MiniTable items={rows} />;
};

export default connect(
  // mapStateToProps
  (state: RootState, { uavId }: StatusSummaryMiniTableOwnProps) =>
    uavId === undefined ? {} : (getUAVById(state, uavId) ?? {})
)(StatusSummaryMiniTable);

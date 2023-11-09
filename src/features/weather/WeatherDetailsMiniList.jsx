import isAfter from 'date-fns/isAfter';
import format from 'date-fns/format';
import isNil from 'lodash-es/isNil';
import PropTypes from 'prop-types';
import React from 'react';
import { withTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import TimeAgo from 'react-timeago';

import { colorForSeverity } from '~/components/colors';
import { Severity } from '~/model/enums';
import {
  formatNumberSafely,
  shortRelativeTimeFormatter,
} from '~/utils/formatting';

import MiniList from '@skybrush/mui-components/lib/MiniList';
import MiniListItem from '@skybrush/mui-components/lib/MiniListItem';
import MiniListDivider from '@skybrush/mui-components/lib/MiniListDivider';
import SmallProgressIndicator from '@skybrush/mui-components/lib/SmallProgressIndicator';
import StatusText from '@skybrush/mui-components/lib/StatusText';

import {
  getDeclinationFromMagneticVector,
  getSunriseSunsetTimesForMapViewCenterPosition,
  getStatusForKpIndex,
} from './selectors';

function safelyFormat(time, formatString) {
  try {
    return format(time, formatString);
  } catch {
    return '';
  }
}

function formatInterval(start, end) {
  start = start ? safelyFormat(start, 'H:mm') : '';
  end = end ? safelyFormat(end, 'H:mm') : '';

  if (start === end || (start && !end)) {
    return start;
  } else if (start && end) {
    return `${start} – ${end}`;
  } else {
    return end;
  }
}

const listStyle = {
  minWidth: 150,
};

const WeatherDetailsMiniList = ({
  data,
  error,
  lastUpdatedAt,
  loading,
  sunrise,
  sunriseEnd,
  sunset,
  sunsetStart,
  t,
  timezone,
  utcOffset,
}) => {
  const items = [];
  let needSeparator;

  if (timezone) {
    items.push(
      <MiniListItem
        key='timezone'
        primaryText={t('weatherMiniList.timezone')}
        secondaryText={timezone}
      />
    );
  }

  if (utcOffset) {
    const remainder = String(Math.abs(utcOffset) % 60);
    const fraction = String((Math.abs(utcOffset) - remainder) / 60);
    const sign = utcOffset < 0 ? '+' : utcOffset > 0 ? '-' : ''; // sign reversal is correct, not a mistake
    const formattedUtcOffset =
      sign + fraction.padStart(2, '0') + ':' + remainder.padStart(2, '0');
    items.push(
      <MiniListItem
        key='utcOffset'
        primaryText={t('weatherMiniList.utcOffset')}
        secondaryText={formattedUtcOffset}
      />
    );
  }

  if (items.length > 0) {
    items.push(<MiniListDivider key='sep1' />);
  }

  needSeparator = false;

  if (sunset || sunsetStart) {
    items.push(
      <MiniListItem
        key='sunset'
        primaryText={t('weatherMiniList.sunset')}
        secondaryText={formatInterval(sunsetStart, sunset)}
      />
    );
    needSeparator = true;
  }

  if (sunrise || sunriseEnd) {
    const item = (
      <MiniListItem
        key='sunrise'
        primaryText={t('weatherMiniList.sunrise')}
        secondaryText={formatInterval(sunrise, sunriseEnd)}
      />
    );
    if (sunset && isAfter(sunset, sunrise)) {
      items.splice(items.length - 1, 0, item);
    } else {
      items.push(item);
    }
    needSeparator = true;
  }

  if (needSeparator) {
    items.push(<MiniListDivider key='sep2' />);
  }

  const { kpIndex, magneticVector } = data || {};
  const declination = getDeclinationFromMagneticVector(magneticVector);
  if (!isNil(kpIndex)) {
    items.push(
      <MiniListItem
        key='kpIndex'
        primaryText={t('weatherMiniList.kpIndex')}
        secondaryText={
          <StatusText status={getStatusForKpIndex(kpIndex)}>
            {formatNumberSafely(kpIndex, 1)}
          </StatusText>
        }
      />
    );
  }

  if (!isNil(declination)) {
    items.push(
      <MiniListItem
        key='declination'
        primaryText={t('weatherMiniList.compassDeclination')}
        secondaryText={
          !isNil(declination)
            ? formatNumberSafely(Math.abs(declination), 2, '°') +
              ' ' +
              (declination >= 0 ? 'E' : 'W')
            : /* formats null nicely with a dash: */ formatNumberSafely(
                declination
              )
        }
      />
    );
  }

  if (loading) {
    items.push(
      <SmallProgressIndicator
        key='loadingIndicator'
        label={t('weatherMiniList.refreshing')}
        padding={0.5}
      />
    );
  } else {
    items.push(
      <MiniListItem
        key='lastUpdatedAt'
        primaryText={t('weatherMiniList.lastUpdate')}
        secondaryText={
          error ? (
            <span
              style={{
                color: colorForSeverity(Severity.ERROR),
                fontWeight: 'bold',
              }}
            >
              failed
            </span>
          ) : lastUpdatedAt ? (
            <TimeAgo
              formatter={shortRelativeTimeFormatter}
              date={lastUpdatedAt}
            />
          ) : (
            '—'
          )
        }
      />
    );
  }

  if (items.length > 0) {
    return <MiniList style={listStyle}>{items}</MiniList>;
  } else {
    return t('weatherMiniList.noWeatherInfo');
  }
};

WeatherDetailsMiniList.propTypes = {
  error: PropTypes.any,
  sunrise: PropTypes.instanceOf(Date),
  sunriseEnd: PropTypes.instanceOf(Date),
  sunsetStart: PropTypes.instanceOf(Date),
  sunset: PropTypes.instanceOf(Date),
  t: PropTypes.func,
  timezone: PropTypes.string,
  utcOffset: PropTypes.number,
};

export default connect(
  // mapStateToProps
  (state) => ({
    ...getSunriseSunsetTimesForMapViewCenterPosition(state),
    /* eslint-disable: new-cap */
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    /* eslint-enable: new-cap */
    utcOffset: new Date().getTimezoneOffset(),
    ...state.weather,
  }),
  // mapDispatchToProps
  {}
)(withTranslation()(WeatherDetailsMiniList));

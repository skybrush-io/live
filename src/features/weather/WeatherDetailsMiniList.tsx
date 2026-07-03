import format from 'date-fns/format';
import isAfter from 'date-fns/isAfter';
import isNil from 'lodash-es/isNil';
import type { CSSProperties, ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import TimeAgo from 'react-timeago';

import { Status } from '@skybrush/app-theme-mui';
import type { WeatherInfo } from '@skybrush/flockwave-spec';
import {
  MiniList,
  MiniListDivider,
  MiniListItem,
  SmallProgressIndicator,
  StatusText,
} from '@skybrush/mui-components';

import { colorForSeverity } from '~/components/colors';
import { Severity } from '~/model/enums';
import type { RootState } from '~/store/reducers';
import {
  formatNumberSafely,
  shortRelativeTimeFormatter,
} from '~/utils/formatting';

import {
  getDeclinationFromMagneticVector,
  getStatusForKpIndex,
  getSunriseSunsetTimesForMapViewCenterPosition,
} from './selectors';

function safelyFormat(time: Date | number, formatString: string): string {
  try {
    return format(time, formatString);
  } catch {
    return '';
  }
}

function formatInterval(start?: Date, end?: Date): string {
  const startText = start ? safelyFormat(start, 'H:mm') : '';
  const endText = end ? safelyFormat(end, 'H:mm') : '';

  if (startText === endText || (startText && !endText)) {
    return startText;
  } else if (startText && endText) {
    return `${startText} – ${endText}`;
  } else {
    return endText;
  }
}

const listStyle: CSSProperties = {
  minWidth: 150,
};

type WeatherDetailsMiniListProps = {
  data?: WeatherInfo;
  error?: string;
  lastUpdatedAt?: number;
  loading: boolean;
  sunrise?: Date;
  sunriseEnd?: Date;
  sunset?: Date;
  sunsetStart?: Date;
  timezone?: string;
  utcOffset?: number;
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
  timezone,
  utcOffset,
}: WeatherDetailsMiniListProps) => {
  const { t } = useTranslation();
  const items: ReactElement[] = [];
  let needSeparator: boolean;

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
    const absOffset = Math.abs(utcOffset);
    const hours = Math.floor(absOffset / 60);
    const minutes = absOffset % 60;
    const sign = utcOffset < 0 ? '+' : utcOffset > 0 ? '-' : ''; // sign reversal is correct, not a mistake
    const formattedUtcOffset =
      sign +
      String(hours).padStart(2, '0') +
      ':' +
      String(minutes).padStart(2, '0');
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
    if (sunrise && sunset && isAfter(sunset, sunrise)) {
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
  const declination = magneticVector
    ? getDeclinationFromMagneticVector(magneticVector)
    : null;

  if (!isNil(kpIndex)) {
    items.push(
      <MiniListItem
        key='kpIndex'
        primaryText={t('weatherMiniList.kpIndex')}
        secondaryText={
          <StatusText status={getStatusForKpIndex(kpIndex) ?? Status.OFF}>
            {formatNumberSafely(kpIndex, 1)}
          </StatusText>
        }
      />
    );
  }

  if (declination !== null) {
    items.push(
      <MiniListItem
        key='declination'
        primaryText={t('weatherMiniList.compassDeclination')}
        secondaryText={`${Math.abs(declination).toFixed(2)}° ${
          declination >= 0 ? 'E' : 'W'
        }`}
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

const ConnectedWeatherDetailsMiniList = connect(
  // mapStateToProps
  (state: RootState) => ({
    ...getSunriseSunsetTimesForMapViewCenterPosition(state),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    utcOffset: new Date().getTimezoneOffset(),
    data: state.weather.data,
    error: state.weather.error,
    lastUpdatedAt: state.weather.lastUpdatedAt,
    loading: state.weather.loading,
  }),
  // mapDispatchToProps
  {}
)(WeatherDetailsMiniList);

export default ConnectedWeatherDetailsMiniList;

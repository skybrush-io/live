import differenceInMinutes from 'date-fns/differenceInMinutes';
import format from 'date-fns/format';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import TimeAgo from 'react-timeago';
import { useToggle } from 'react-use';

import GenericHeaderButton from '@skybrush/mui-components/lib/GenericHeaderButton';
import LazyTooltip from '@skybrush/mui-components/lib/LazyTooltip';

import { usePeriodicRefresh } from '~/hooks';
import Sunrise from '~/icons/Sunrise';
import Sunset from '~/icons/Sunset';
import { shortRelativeTimeFormatter } from '~/utils/formatting';

import { getSunriseSunsetTimesForMapViewCenterPosition } from './selectors';
import WeatherDetailsMiniList from './WeatherDetailsMiniList';

const buttonStyle = {
  justifyContent: 'space-between',
  textAlign: 'right',
  width: 90,
};

const WeatherHeaderButton = ({ sunrise, sunset }) => {
  /* Show sunset time if we are closer to the sunset than to the sunrise */
  const now = new Date();
  const [negate, toggleNegate] = useToggle();
  let shouldShowSunset =
    !sunrise ||
    (sunset &&
      Math.abs(differenceInMinutes(sunrise, now)) >
        Math.abs(differenceInMinutes(sunset, now)));
  if (negate) {
    shouldShowSunset = !shouldShowSunset;
  }

  const referenceTime = shouldShowSunset ? sunset : sunrise;

  /* refresh every 30s */
  usePeriodicRefresh(30000);

  return (
    <LazyTooltip content={<WeatherDetailsMiniList />}>
      <GenericHeaderButton
        label={referenceTime ? format(referenceTime, 'H:mm') : '—'}
        secondaryLabel={
          referenceTime ? (
            <TimeAgo
              formatter={shortRelativeTimeFormatter}
              date={referenceTime}
            />
          ) : null
        }
        style={buttonStyle}
        onClick={() => toggleNegate()}
      >
        {shouldShowSunset ? <Sunset /> : <Sunrise />}
      </GenericHeaderButton>
    </LazyTooltip>
  );
};

WeatherHeaderButton.propTypes = {
  sunrise: PropTypes.instanceOf(Date),
  sunset: PropTypes.instanceOf(Date),
};

export default connect(
  // mapStateToProps
  getSunriseSunsetTimesForMapViewCenterPosition,
  // mapDispatchToProps
  {}
)(WeatherHeaderButton);

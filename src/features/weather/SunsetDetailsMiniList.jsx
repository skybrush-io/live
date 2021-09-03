import isAfter from 'date-fns/isAfter';
import format from 'date-fns/format';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import MiniList from '@skybrush/mui-components/lib/MiniList';
import MiniListItem from '@skybrush/mui-components/lib/MiniListItem';

import { getSunriseSunsetTimesForMapViewCenterPosition } from './selectors';

function formatInterval(start, end) {
  start = start ? format(start, 'H:mm') : '';
  end = end ? format(end, 'H:mm') : '';

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

const SunsetDetailsMiniList = ({
  sunrise,
  sunriseEnd,
  sunset,
  sunsetStart,
}) => {
  const items = [];

  if (sunset || sunsetStart) {
    items.push(
      <MiniListItem
        key='sunset'
        primaryText='Sunset'
        secondaryText={formatInterval(sunsetStart, sunset)}
      />
    );
  }

  if (sunrise || sunriseEnd) {
    const item = (
      <MiniListItem
        key='sunrise'
        primaryText='Sunrise'
        secondaryText={formatInterval(sunrise, sunriseEnd)}
      />
    );
    if (sunset && isAfter(sunset, sunrise)) {
      items.splice(0, 0, item);
    } else {
      items.push(item);
    }
  }

  if (items.length > 0) {
    return <MiniList style={listStyle}>{items}</MiniList>;
  } else {
    return 'No sunrise or sunset on the current day';
  }
};

SunsetDetailsMiniList.propTypes = {
  sunrise: PropTypes.instanceOf(Date),
  sunriseEnd: PropTypes.instanceOf(Date),
  sunsetStart: PropTypes.instanceOf(Date),
  sunset: PropTypes.instanceOf(Date),
};

export default connect(
  // mapStateToProps
  getSunriseSunsetTimesForMapViewCenterPosition,
  // mapDispatchToProps
  {}
)(SunsetDetailsMiniList);

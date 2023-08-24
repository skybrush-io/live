import { getDistance as haversineDistance } from 'ol/sphere';
import Typography from '@material-ui/core/Typography';
import { createSelector } from '@reduxjs/toolkit';

import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import { formatDistance } from '~/utils/formatting';
import { bearing, finalBearing } from '~/utils/geography';

import {
  getAllUAVIdsCurrentlyBeingAveragedEvenIfPaused,
  getAveragingMeasurementsById,
  getSelectedUAVIdsForAveragingMeasurement,
} from './selectors';

/**
 * Specialized selector that returns the IDs of the two UAVs that are selected
 * if there are exactly two UAVs selected, and undefined otherwise.
 */
const getSelectedUAVIdPair = createSelector(
  getSelectedUAVIdsForAveragingMeasurement,
  getAveragingMeasurementsById,
  (selectedUAVIds, measurementsById) => {
    if (selectedUAVIds.length === 2) {
      const first = measurementsById[selectedUAVIds[0]];
      const second = measurementsById[selectedUAVIds[1]];

      if (first && second) {
        return selectedUAVIds;
      }
    }
  }
);

/**
 * Specialized selector that returns the coordinates of the UAVs in the
 * current selection if there are exactly two UAVs selected.
 */
const getCoordinatesOfSelectedUAVPair = createSelector(
  getSelectedUAVIdPair,
  getAveragingMeasurementsById,
  (selectedUAVIds, measurementsById) => {
    if (selectedUAVIds && selectedUAVIds.length === 2) {
      const first = measurementsById[selectedUAVIds[0]];
      const second = measurementsById[selectedUAVIds[1]];

      return [
        [first.mean.lon, first.mean.lat],
        [second.mean.lon, second.mean.lat],
      ];
    }

    return undefined;
  }
);

const BearingCalculator = ({
  coordinates,
  hasEnoughMeasurements,
  selectedUAVIdPair,
}) => {
  if (selectedUAVIdPair) {
    const bearing1 = bearing(coordinates[0], coordinates[1]).toFixed(1);
    const bearing2 = finalBearing(coordinates[0], coordinates[1]).toFixed(1);

    return (
      <>
        <Typography color='textSecondary' variant='body2' component='span'>
          {selectedUAVIdPair[0]} → {selectedUAVIdPair[1]}:{' '}
        </Typography>
        <Typography variant='body2' component='span'>
          {formatDistance(haversineDistance(coordinates[0], coordinates[1]))}
        </Typography>
        {bearing1 === bearing2 ? (
          <>
            <Typography color='textSecondary' variant='body2' component='span'>
              {', bearing: '}
            </Typography>
            <Typography variant='body2' component='span'>
              {bearing1}°
            </Typography>
          </>
        ) : (
          <>
            <Typography color='textSecondary' variant='body2' component='span'>
              {', initial bearing: '}
            </Typography>
            <Typography variant='body2' component='span'>
              {bearing1}°
            </Typography>
            <Typography color='textSecondary' variant='body2' component='span'>
              {', final bearing: '}
            </Typography>
            <Typography variant='body2' component='span'>
              {bearing2}°
            </Typography>
          </>
        )}
      </>
    );
  }

  return (
    <Typography color='textSecondary' variant='body2' align='center'>
      {hasEnoughMeasurements
        ? 'Select exactly two items to calculate the bearing and distance between them'
        : 'Add at least two items to calculate the bearing and distance between them'}
    </Typography>
  );
};

BearingCalculator.propTypes = {
  coordinates: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number)),
  hasEnoughMeasurements: PropTypes.bool,
  selectedUAVIdPair: PropTypes.arrayOf(PropTypes.string),
};

export default connect(
  // mapStateToProps
  (state) => ({
    coordinates: getCoordinatesOfSelectedUAVPair(state),
    selectedUAVIdPair: getSelectedUAVIdPair(state),
    hasEnoughMeasurements:
      getAllUAVIdsCurrentlyBeingAveragedEvenIfPaused(state).length >= 2,
  })
)(BearingCalculator);

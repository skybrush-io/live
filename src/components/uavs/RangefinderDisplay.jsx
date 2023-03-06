import React from 'react';
import PropTypes from 'prop-types';

import Box from '@material-ui/core/Box';

import { makeStyles } from '@material-ui/core/styles';
import { formatNumberAndUnit } from '~/utils/formatting';

import RangefinderDisplaySector, {
  SectorStatus,
} from './RangefinderDisplaySector';
import RangefinderDisplayCenter from './RangefinderDisplayCenter';

const useStyles = makeStyles((theme) => ({
  container: {
    // Constraining the size
    maxWidth: '35%',
    maxHeight: '35%',
    aspectRatio: '1 / 1',

    // Centering in the parent
    position: 'relative',
    inset: '50%',
    transform: 'translateX(-50%) translateY(-50%)',
  },

  circle: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    border: `0.5em solid ${theme.palette.info.main}`,
    borderRadius: '50%',
  },
}));

const Dimension = {
  HORIZONTAL: 'horizontal',
  VERTICAL: 'vertical',
};

// prettier-ignore
const directions = [
  { name: 'down'       , dimension: Dimension.VERTICAL  , heading:  180 },
  { name: 'front'      , dimension: Dimension.HORIZONTAL, heading:    0 },
  { name: 'front-right', dimension: Dimension.HORIZONTAL, heading:   45 },
  { name: 'front-left' , dimension: Dimension.HORIZONTAL, heading: - 45 },
  { name: 'right'      , dimension: Dimension.HORIZONTAL, heading:   90 },
  { name: 'left'       , dimension: Dimension.HORIZONTAL, heading: - 90 },
  { name: 'back-right' , dimension: Dimension.HORIZONTAL, heading:  135 },
  { name: 'back-left'  , dimension: Dimension.HORIZONTAL, heading: -135 },
  { name: 'back'       , dimension: Dimension.HORIZONTAL, heading:  180 },
  { name: 'up'         , dimension: Dimension.VERTICAL  , heading:    0 },
];

const CUSTOM_DISTANCE_UNITS = [
  { multiplier: 1, unit: 'm', digits: 2 },
  { multiplier: 0.01, unit: 'cm', digits: 0 },
];

/**
 * Widget that can display the data arriving from a rangefinder device.
 */
const RangefinderDisplay = ({
  limits = { near: 2.5, mid: 5, far: 7.5 },
  values = [],
}) => {
  const classes = useStyles();
  const withValues = directions.map((d, i) => ({ ...d, value: values[i] }));
  const getDistanceAndStatus = (value) => ({
    distance: Number.isFinite(value)
      ? formatNumberAndUnit(value, CUSTOM_DISTANCE_UNITS)
      : '∞',
    // prettier-ignore
    status:
      value < limits.near ? SectorStatus.NEAR :
      value < limits.mid  ? SectorStatus.MID  :
      value < limits.far  ? SectorStatus.FAR  :
                            SectorStatus.OFF,
  });
  return (
    <Box height='100%' widht='100%' overflow='hidden'>
      <div className={classes.container}>
        <RangefinderDisplayCenter {...getDistanceAndStatus(values[0])} />
        <div className={classes.circle} />
        {withValues
          .filter(
            (d) => d.dimension === Dimension.HORIZONTAL && d.value !== null
          )
          .map(({ name, heading, value }) => (
            <RangefinderDisplaySector
              key={name}
              angle={40}
              rotation={heading}
              {...getDistanceAndStatus(value)}
            />
          ))}
      </div>
    </Box>
  );
};

RangefinderDisplay.propTypes = {
  limits: PropTypes.objectOf(PropTypes.number),
  values: PropTypes.arrayOf(PropTypes.number),
};

export default RangefinderDisplay;

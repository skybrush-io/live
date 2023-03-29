import clsx from 'clsx';
import identity from 'lodash-es/identity';
import isNil from 'lodash-es/isNil';
import { getDistance as haversineDistance } from 'ol/sphere';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import IconButton from '@material-ui/core/IconButton';
import ListItem from '@material-ui/core/ListItem';
import ListItemAvatar from '@material-ui/core/ListItemAvatar';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import ListItemText from '@material-ui/core/ListItemText';
import { makeStyles } from '@material-ui/core/styles';

import BackgroundHint from '@skybrush/mui-components/lib/BackgroundHint';
import Tooltip from '@skybrush/mui-components/lib/Tooltip';

import Colors from '~/components/colors';
import { multiSelectableListOf } from '~/components/helpers/lists';
import DroneAvatar from '~/components/uavs/DroneAvatar';
import ContentCopy from '~/icons/ContentCopy';
import { getPreferredCoordinateFormatter } from '~/selectors/formatting';
import { formatDistance, formatDuration } from '~/utils/formatting';

import { copyCentroidOfAveragedCoordinatesToClipboard } from './actions';
import {
  getAveragingMeasurements,
  getSelectedUAVIdsForAveragingMeasurement,
} from './selectors';
import { setSelectedUAVIdsForAveragingMeasurement } from './slice';

const formatMeanAndStdDev = (mean, sqDiff, numberOfSamples) => {
  if (sqDiff > 0 && numberOfSamples > 1) {
    return `${mean.toFixed(1)} ± ${Math.sqrt(
      sqDiff / (numberOfSamples - 1)
    ).toFixed(1)}`;
  }

  return mean.toFixed(1);
};

const formatStdDevInXYPlane = (mean, sqDiff, numberOfSamples) => {
  if (numberOfSamples < 2) {
    return '0';
  }

  const stdLat = Math.sqrt(sqDiff.lat / (numberOfSamples - 1));
  const stdLon = Math.sqrt(sqDiff.lon / (numberOfSamples - 1));

  const diff =
    haversineDistance(
      [mean.lon - stdLon, mean.lat - stdLat],
      [mean.lon + stdLon, mean.lat + stdLat]
    ) / 2;
  return formatDistance(diff, 1);
};

const formatDurationOfSampling = (startedAt, lastSampleAt, extraSamplingTime) =>
  formatDuration(
    ((!isNil(lastSampleAt) && !isNil(startedAt)
      ? lastSampleAt - startedAt
      : 0) +
      (extraSamplingTime || 0)) /
      1000
  );

const useStyles = makeStyles(
  (theme) => ({
    root: {
      fontVariantNumeric: 'lining-nums tabular-nums',

      '&>div:first-child>div:first-child': {
        maxWidth: 44 /* used to ensure that the cross looks nice when not sampling */,
      },
    },

    dim: {
      color: theme.palette.text.secondary,
    },

    avatar: {
      transition: theme.transitions.create(['background-color', 'color'], {
        duration: theme.transitions.duration.short,
      }),
    },

    sampling: {
      backgroundColor: Colors.success,
      color: theme.palette.getContrastText(Colors.success),
      position: 'relative',
    },

    primaryContainer: {
      display: 'flex',
    },

    secondaryContainer: {
      display: 'flex',
    },

    latLonCoordinatesColumn: {
      minWidth: 180,
    },

    amslColumn: {
      minWidth: 140,
    },

    ahlColumn: {
      minWidth: 80,
      flex: 1,
    },
  }),
  { name: 'MeasurementListItem' }
);

const MeasurementListItem = ({
  coordinateFormatter,
  measurement,
  onCopy,
  ...rest
}) => {
  const classes = useStyles();
  const {
    extraSamplingTime,
    id,
    lastSampleAt,
    startedAt,
    mean,
    numSamples,
    sampling,
    sqDiff,
  } = measurement || {};

  const effectiveFormatter = coordinateFormatter || identity;
  const coords = [mean.lon, mean.lat];
  let primaryText;
  let secondaryText;

  if (numSamples <= 0) {
    primaryText = 'Waiting for samples…';
    secondaryText = (
      <div className={clsx(classes.dim, classes.secondaryContainer)}>
        No samples yet
      </div>
    );
  } else {
    primaryText = (
      <div className={classes.primaryContainer}>
        <div className={classes.latLonCoordinatesColumn}>
          {effectiveFormatter(coords)}
        </div>
        <div className={classes.amslColumn}>
          {formatMeanAndStdDev(mean.amsl, sqDiff.amsl, numSamples)}
          {'m '}
          <span className={classes.dim}>AMSL</span>
        </div>
        <div className={classes.ahlColumn}>
          {formatMeanAndStdDev(mean.ahl, sqDiff.ahl, numSamples)}
          {'m '}
          <span className={classes.dim}>AHL</span>
        </div>
      </div>
    );

    secondaryText = (
      <div className={classes.secondaryContainer}>
        <div className={classes.latLonCoordinatesColumn}>
          {formatStdDevInXYPlane(mean, sqDiff, numSamples)}{' '}
          <span className={classes.dim}>std.dev. in XY</span>
        </div>
        <div className={clsx(classes.dim, classes.amslColumn)}>
          {numSamples} samples
        </div>
        <div className={clsx(classes.dim, classes.ahlColumn)}>
          Duration:{' '}
          {formatDurationOfSampling(startedAt, lastSampleAt, extraSamplingTime)}
        </div>
      </div>
    );
  }

  return (
    <ListItem button {...rest} className={classes.root}>
      <ListItemAvatar>
        <DroneAvatar id={id} variant='minimal' crossed={!sampling} />
      </ListItemAvatar>
      <ListItemText
        disableTypography
        primary={primaryText}
        secondary={secondaryText}
      />
      {numSamples > 0 && (
        <ListItemSecondaryAction>
          <Tooltip content='Copy to clipboard'>
            <IconButton edge='end' aria-label='copy' onClick={() => onCopy(id)}>
              <ContentCopy />
            </IconButton>
          </Tooltip>
        </ListItemSecondaryAction>
      )}
    </ListItem>
  );
};

MeasurementListItem.propTypes = {
  coordinateFormatter: PropTypes.func,
  measurement: PropTypes.shape({
    id: PropTypes.string,
    numSamples: PropTypes.number,
    sampling: PropTypes.bool,
  }).isRequired,
  onCopy: PropTypes.func,
};

const MeasurementList = multiSelectableListOf(
  (item, props, selected) => (
    <MeasurementListItem
      key={item.id}
      coordinateFormatter={props.coordinateFormatter}
      measurement={item}
      selected={selected}
      onClick={props.onItemSelected}
      onCopy={props.onCopy}
    />
  ),
  {
    dataProvider: 'measurements',
    backgroundHint: (
      <BackgroundHint
        style={{ padding: 16 }}
        text='Add a drone to measure with the + button in the toolbar'
      />
    ),
  }
);

export default connect(
  // mapStateToProps
  (state) => ({
    coordinateFormatter: getPreferredCoordinateFormatter(state),
    dense: true,
    fullWidth: true,
    measurements: getAveragingMeasurements(state),
    value: getSelectedUAVIdsForAveragingMeasurement(state),
  }),
  // mapDispatchToProps
  {
    onChange: setSelectedUAVIdsForAveragingMeasurement,
    onCopy: (uavId) => (dispatch) =>
      dispatch(copyCentroidOfAveragedCoordinatesToClipboard([uavId])),
  }
)(MeasurementList);

import clsx from 'clsx';
import identity from 'lodash-es/identity';
import isNil from 'lodash-es/isNil';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import Avatar from '@material-ui/core/Avatar';
import Badge from '@material-ui/core/Badge';
import IconButton from '@material-ui/core/IconButton';
import ListItem from '@material-ui/core/ListItem';
import ListItemAvatar from '@material-ui/core/ListItemAvatar';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import ListItemText from '@material-ui/core/ListItemText';
import { makeStyles } from '@material-ui/core/styles';

import BackgroundHint from '~/components/BackgroundHint';
import Tooltip from '~/components/Tooltip';
import Colors from '~/components/colors';
import { multiSelectableListOf } from '~/components/helpers/lists';

import { copyCentroidOfAveragedCoordinatesToClipboard } from '~/features/measurement/actions';
import {
  getAveragingMeasurements,
  getSelectedUAVIdsForAveragingMeasurement,
} from '~/features/measurement/selectors';
import { setSelectedUAVIdsForAveragingMeasurement } from '~/features/measurement/slice';

import ContentCopy from '~/icons/ContentCopy';
import { getPreferredCoordinateFormatter } from '~/selectors/formatting';
import { formatDuration } from '~/utils/formatting';

const formatMeanAndStd = (mean, sqDiff, numberSamples) => {
  if (sqDiff > 0 && numberSamples > 1) {
    return `${mean.toFixed(1)} ± ${Math.sqrt(
      sqDiff / (numberSamples - 1)
    ).toFixed(1)}`;
  }

  return mean.toFixed(1);
};

const useStyles = makeStyles(
  (theme) => ({
    root: {
      fontVariantNumeric: 'lining-nums tabular-nums',
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

    aglColumn: {
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
    secondaryText = 'No samples yet';
  } else {
    primaryText = (
      <div className={classes.primaryContainer}>
        <div className={classes.latLonCoordinatesColumn}>
          {effectiveFormatter(coords)}
        </div>
        <div className={classes.amslColumn}>
          {formatMeanAndStd(mean.amsl, sqDiff.amsl, numSamples)}
          {'m '}
          <span className={classes.dim}>AMSL</span>
        </div>
        <div className={classes.aglColumn}>
          {formatMeanAndStd(mean.agl, sqDiff.agl, numSamples)}
          {'m '}
          <span className={classes.dim}>AGL</span>
        </div>
      </div>
    );

    if (numSamples === 1) {
      secondaryText = 'Single sample';
    } else {
      secondaryText = (
        <div className={classes.secondaryContainer}>
          <div className={classes.latLonCoordinatesColumn}>
            TODO <span className={classes.dim}>std.dev. in XY</span>
          </div>
          <div className={clsx(classes.dim, classes.amslColumn)}>
            {numSamples} samples
          </div>
          <div className={clsx(classes.dim, classes.aglColumn)}>
            Duration:{' '}
            {formatDuration(
              ((!isNil(lastSampleAt) && !isNil(startedAt)
                ? lastSampleAt - startedAt
                : 0) +
                (extraSamplingTime || 0)) /
                1000
            )}
          </div>
        </div>
      );
    }
  }

  return (
    <ListItem button {...rest} className={classes.root}>
      <ListItemAvatar>
        <Badge
          overlap='circle'
          invisible={sampling}
          badgeContent='■'
          color='error'
        >
          <Avatar
            className={clsx(classes.avatar, sampling && classes.sampling)}
          >
            {id}
          </Avatar>
        </Badge>
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

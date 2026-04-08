import IconButton from '@mui/material/IconButton';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemButton, {
  type ListItemButtonProps,
} from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import clsx from 'clsx';
import identity from 'lodash-es/identity';
import isNil from 'lodash-es/isNil';
import { getDistance as haversineDistance } from 'ol/sphere';
import { Translation, useTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import { makeStyles } from '@skybrush/app-theme-mui';
import { BackgroundHint, Tooltip } from '@skybrush/mui-components';

import Colors from '~/components/colors';
import {
  multiSelectableListOf,
  type MultiSelectableListProps,
} from '~/components/helpers/lists';
import DroneAvatar from '~/components/uavs/DroneAvatar';
import ContentCopy from '~/icons/ContentCopy';
import {
  getPreferredCoordinateFormatter,
  type CoordinatePairFormatter,
} from '~/selectors/formatting';
import type { AppDispatch, RootState } from '~/store/reducers';
import { formatDistance, formatDuration } from '~/utils/formatting';
import type { LatLonObject, LonLat } from '~/utils/geography';

import { copyCentroidOfAveragedCoordinatesToClipboard } from './actions';
import {
  getAveragingMeasurements,
  getSelectedUAVIdsForAveragingMeasurement,
} from './selectors';
import { setSelectedUAVIdsForAveragingMeasurement } from './slice';
import type { AveragingResult } from './types';

const formatMeanAndStdDev = (
  mean: number,
  sqDiff: number,
  numberOfSamples: number
): string => {
  if (sqDiff > 0 && numberOfSamples > 1) {
    return `${mean.toFixed(1)} ± ${Math.sqrt(
      sqDiff / (numberOfSamples - 1)
    ).toFixed(1)}`;
  }

  return mean.toFixed(1);
};

const formatStdDevInXYPlane = (
  mean: LatLonObject,
  sqDiff: LatLonObject,
  numberOfSamples: number
): string => {
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

const formatDurationOfSampling = (
  startedAt: number,
  lastSampleAt: number,
  extraSamplingTime: number
): string =>
  formatDuration(
    ((!isNil(lastSampleAt) && !isNil(startedAt)
      ? lastSampleAt - startedAt
      : 0) +
      (extraSamplingTime || 0)) /
      1000
  );

const useStyles = makeStyles((theme) => ({
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
    minWidth: 190,
  },

  amslColumn: {
    minWidth: 140,
  },

  ahlColumn: {
    minWidth: 80,
    flex: 1,
  },
}));

type MeasurementListItemProps = ListItemButtonProps & {
  coordinateFormatter?: CoordinatePairFormatter;
  measurement: AveragingResult;
  onCopy?: (id: string) => void;
};

const MeasurementListItem = ({
  coordinateFormatter,
  measurement,
  onCopy,
  ...rest
}: MeasurementListItemProps) => {
  const classes = useStyles();
  const { t } = useTranslation();

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

  const effectiveFormatter: CoordinatePairFormatter =
    coordinateFormatter ?? identity;
  const coords: LonLat = [mean.lon, mean.lat];
  let primaryText;
  let secondaryText;

  if (numSamples <= 0) {
    primaryText = t('measurementList.waitingForSamples');
    secondaryText = (
      <div className={clsx(classes.dim, classes.secondaryContainer)}>
        {t('measurementList.noSamplesYet')}
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
          <span className={classes.dim}>{t('measurementList.stdDevInXY')}</span>
        </div>
        <div className={clsx(classes.dim, classes.amslColumn)}>
          {numSamples} {t('measurementList.samples')}
        </div>
        <div className={clsx(classes.dim, classes.ahlColumn)}>
          {`${t('measurementList.duration')}: `}
          {formatDurationOfSampling(
            startedAt!,
            lastSampleAt!,
            extraSamplingTime
          )}
        </div>
      </div>
    );
  }

  const copyButton =
    numSamples > 0 ? (
      <Tooltip content={t('measurementList.copyToClipboard')}>
        <IconButton
          edge='end'
          aria-label='copy'
          size='large'
          onClick={onCopy ? () => onCopy(id) : undefined}
        >
          <ContentCopy />
        </IconButton>
      </Tooltip>
    ) : undefined;

  return (
    <ListItem
      className={classes.root}
      secondaryAction={copyButton}
      disablePadding
    >
      <ListItemButton {...rest}>
        <ListItemAvatar>
          <DroneAvatar id={id} variant='minimal' crossed={!sampling} />
        </ListItemAvatar>
        <ListItemText
          disableTypography
          primary={primaryText}
          secondary={secondaryText}
        />
      </ListItemButton>
    </ListItem>
  );
};

type MeasurementListProps = MultiSelectableListProps & {
  coordinateFormatter?: CoordinatePairFormatter;
  measurements: AveragingResult[];
  onCopy?: (id: string) => void;
};

const MeasurementList = multiSelectableListOf<
  AveragingResult,
  MeasurementListProps
>(
  (item, props, selected) => (
    <MeasurementListItem
      key={item.id}
      coordinateFormatter={props.coordinateFormatter}
      measurement={item}
      selected={selected}
      onClick={props.onItemSelected}
      onCopy={props.onCopy as any}
    />
  ),
  {
    dataProvider: 'measurements',
    backgroundHint: (
      <Translation>
        {(t) => (
          <BackgroundHint
            style={{ padding: 16 }}
            text={t('measurementList.addDrone')}
          />
        )}
      </Translation>
    ),
  }
);

export default connect(
  // mapStateToProps
  (state: RootState) => ({
    coordinateFormatter: getPreferredCoordinateFormatter(state),
    measurements: getAveragingMeasurements(state),
    value: getSelectedUAVIdsForAveragingMeasurement(state),
    dense: true,
    fullWidth: true,
  }),
  // mapDispatchToProps
  {
    onChange: setSelectedUAVIdsForAveragingMeasurement,
    onCopy: (uavId: string) => (dispatch: AppDispatch) =>
      dispatch(copyCentroidOfAveragedCoordinatesToClipboard([uavId])),
  }
)(MeasurementList);

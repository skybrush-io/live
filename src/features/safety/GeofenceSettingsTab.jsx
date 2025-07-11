/**
 * @file Tab that shows the geofence settings and allows the user to edit them.
 */

import createDecorator from 'final-form-calculate';
import max from 'lodash-es/max';
import unary from 'lodash-es/unary';
import { Checkboxes, Select, TextField } from 'mui-rff';
import PropTypes from 'prop-types';
import React from 'react';
import { Form } from 'react-final-form';
import { withTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import FormHelperText from '@material-ui/core/FormHelperText';
import InputAdornment from '@material-ui/core/InputAdornment';
import MenuItem from '@material-ui/core/MenuItem';

import FormHeader from '@skybrush/mui-components/lib/FormHeader';

import * as TurfHelpers from '@turf/helpers';

import { removeFeaturesByIds } from '~/features/map-features/slice';
import {
  getGeofenceAction,
  getGeofencePolygonId,
  getGPSBasedHomePositionsInMission,
  getMissionType,
  hasActiveGeofencePolygon,
} from '~/features/mission/selectors';
import {
  clearGeofencePolygonId,
  setGeofenceAction,
} from '~/features/mission/slice';
import { updateGeofencePolygon } from '~/features/safety/actions';
import useSelectorOnce from '~/hooks/useSelectorOnce';
import { MissionType } from '~/model/missions';
import { rejectNullish } from '~/utils/arrays';
import {
  lonLatFromMapViewCoordinate,
  mapViewCoordinateFromLonLat,
  turfDistanceInMeters,
} from '~/utils/geography';
import {
  atLeast,
  atMost,
  createValidator,
  finite,
  integer,
  required,
} from '~/utils/validation';

import {
  describeGeofenceAction,
  describeGeofenceGenerationMethod,
  GeofenceAction,
  GeofenceGenerationMethod,
} from './model';
import {
  getBoundaryPolygonBasedOnMissionItems,
  getGeofenceSettings,
  getMaximumDistanceBetweenHomePositionsAndGeofence,
  getMaximumHeightForCurrentMissionType,
  getMaximumHorizontalDistanceForCurrentMissionType,
} from './selectors';
import { initialState, updateGeofenceSettings } from './slice';
import {
  makeGeofenceGenerationSettingsApplicator,
  proposeDistanceLimit,
  proposeHeightLimit,
} from './utils';

const VERTEX_COUNT_REDUCTION_LOWER_LIMIT = 3;
const VERTEX_COUNT_REDUCTION_UPPER_LIMIT = 50;

const validator = createValidator({
  horizontalMargin: [required, finite, atLeast(1)],
  verticalMargin: [required, finite, atLeast(1)],
  maxVertexCount: [
    required,
    integer,
    atLeast(VERTEX_COUNT_REDUCTION_LOWER_LIMIT),
    atMost(VERTEX_COUNT_REDUCTION_UPPER_LIMIT),
  ],
});

const calculator = createDecorator(
  {
    field: 'verticalMargin',
    updates: {
      heightLimit(margin, { maxHeight }) {
        return proposeHeightLimit(
          maxHeight,
          Number.isFinite(margin) ? margin : 0
        );
      },
    },
  },
  {
    field: new RegExp(
      [
        'horizontalMargin',
        'generationMethod',
        'simplify',
        'maxVertexCount',
      ].join('|')
    ),
    updates: {
      // TODO: This is currently highly sub-optimal in terms of performance
      //       and code quality as well, improve it, if time allows!
      distanceLimit(
        _margin,
        {
          boundaryPolygonBasedOnMissionItems,
          generationMethod,
          homePositions,
          horizontalMargin,
          maxDistance,
          maxGeofence,
          maxVertexCount,
          missionType,
          simplify,
        }
      ) {
        const { maxValue, margin } = (() => {
          switch (missionType) {
            case MissionType.SHOW:
              return { maxValue: maxDistance, margin: horizontalMargin };

            case MissionType.WAYPOINT: {
              const maxPendingGeofence =
                // TODO: separate convex and concave generation methods
                generationMethod === GeofenceGenerationMethod.MANUAL
                  ? maxGeofence
                  : (() => {
                      const wouldBeGeofenceSettingsApplicator =
                        makeGeofenceGenerationSettingsApplicator({
                          horizontalMargin,
                          maxVertexCount,
                          simplify,
                        });
                      const wouldBeGeofence = boundaryPolygonBasedOnMissionItems
                        .map((cs) => cs.map(unary(mapViewCoordinateFromLonLat)))
                        .andThen(wouldBeGeofenceSettingsApplicator)
                        .map((cs) =>
                          cs.map(unary(lonLatFromMapViewCoordinate))
                        );

                      if (wouldBeGeofence.isOk()) {
                        const homePoints = rejectNullish(homePositions).map(
                          ({ lon, lat }) => TurfHelpers.point([lon, lat])
                        );
                        const wouldBeGeofencePoints = wouldBeGeofence.value.map(
                          ([lon, lat]) => TurfHelpers.point([lon, lat])
                        );
                        return max(
                          homePoints.flatMap((hp) =>
                            wouldBeGeofencePoints.map((gp) =>
                              turfDistanceInMeters(hp, gp)
                            )
                          )
                        );
                      }
                    })();

              return maxPendingGeofence === undefined
                ? { maxValue: maxDistance, margin: horizontalMargin }
                : { maxValue: maxPendingGeofence, margin: 0 };
            }

            default:
              return { maxValue: undefined, margin: undefined };
          }
        })();

        return proposeDistanceLimit(maxValue, margin);
      },
    },
  }
);

const GEOFENCE_GENERATION_METHODS = [
  GeofenceGenerationMethod.MANUAL,
  GeofenceGenerationMethod.CONVEX,
  GeofenceGenerationMethod.CONCAVE,
];

const SUPPORTED_GEOFENCE_ACTIONS = [
  GeofenceAction.KEEP_CURRENT,
  GeofenceAction.REPORT,
  GeofenceAction.RETURN,
  GeofenceAction.LAND,
];

const GeofenceSettingsFormPresentation = ({ onSubmit, t }) => {
  const initialValues = useSelectorOnce((state) => ({
    // NOTE: This key was added later, so it might be missing from the state,
    //       thus a redundant default is provided here.
    //       Maybe we should create a migration if it gets used in more than
    //       one place, but it felt like overkill for now.
    // generate: initialState.geofence.generate,
    // TODO: comment above refers to `generationMethod` as well, that
    // replaces previous `generation` property
    generationMethod: initialState.geofence.generationMethod,
    ...getGeofenceSettings(state),
    action: getGeofenceAction(state),
    boundaryPolygonBasedOnMissionItems:
      getBoundaryPolygonBasedOnMissionItems(state),
    homePositions: getGPSBasedHomePositionsInMission(state),
    maxDistance: getMaximumHorizontalDistanceForCurrentMissionType(state),
    maxGeofence: getMaximumDistanceBetweenHomePositionsAndGeofence(state),
    maxHeight: getMaximumHeightForCurrentMissionType(state),
    missionType: getMissionType(state),
  }));

  return (
    <Form
      initialValues={initialValues}
      validate={validator}
      decorators={[calculator]}
      onSubmit={onSubmit}
    >
      {({
        handleSubmit,
        values: {
          generationMethod,
          maxDistance,
          maxGeofence,
          maxHeight,
          missionType,
          simplify,
        },
      }) => (
        <form id='geofenceSettings' onSubmit={handleSubmit}>
          <FormHeader>{t('safetyDialog.geofenceTab.fenceAction')}</FormHeader>
          <Box display='flex' flexDirection='column'>
            <Select
              name='action'
              label={t('safetyDialog.geofenceTab.fenceActionLabel')}
              variant='filled'
            >
              {SUPPORTED_GEOFENCE_ACTIONS.map((action) => (
                <MenuItem key={action} value={action}>
                  {describeGeofenceAction(action)?.(t)}
                </MenuItem>
              ))}
            </Select>
            <FormHelperText>
              {t('safetyDialog.geofenceTab.fenceActionHelperText')}
            </FormHelperText>
          </Box>

          <FormHeader>{t('safetyDialog.geofenceTab.safetyMargins')}</FormHeader>
          <Box display='flex' flexDirection='row'>
            <TextField
              name='horizontalMargin'
              label={t('safetyDialog.geofenceTab.horizontal')}
              type='number'
              variant='filled'
              fieldProps={{ parse: (v) => v.length > 0 && Number(v) }}
              InputProps={{
                endAdornment: <InputAdornment position='end'>m</InputAdornment>,
                inputProps: { min: 1 },
              }}
            />
            <Box p={1} />
            <TextField
              name='verticalMargin'
              label={t('safetyDialog.geofenceTab.vertical')}
              type='number'
              variant='filled'
              fieldProps={{ parse: (v) => v.length > 0 && Number(v) }}
              InputProps={{
                endAdornment: <InputAdornment position='end'>m</InputAdornment>,
                inputProps: { min: 1 },
              }}
            />
          </Box>

          <FormHeader>
            {t('safetyDialog.geofenceTab.proposedLimits')}
          </FormHeader>
          <Box display='flex' flexDirection='row'>
            <TextField
              disabled
              name='distanceLimit'
              label={t('safetyDialog.geofenceTab.maxDistance')}
              error={
                (missionType === MissionType.SHOW &&
                  maxDistance === undefined) ||
                (missionType === MissionType.WAYPOINT &&
                  maxDistance === undefined &&
                  maxGeofence === undefined) ||
                missionType === MissionType.UNKNOWN
              }
              helperText={
                ((missionType === MissionType.SHOW &&
                  maxDistance === undefined) ||
                  (missionType === MissionType.WAYPOINT &&
                    maxDistance === undefined &&
                    maxGeofence === undefined) ||
                  missionType === MissionType.UNKNOWN) &&
                t('safetyDialog.geofenceTab.errors.distance')
              }
              InputProps={{
                endAdornment: <InputAdornment position='end'>m</InputAdornment>,
              }}
              variant='standard'
            />
            <Box p={1} />
            <TextField
              disabled
              name='heightLimit'
              label={t('safetyDialog.geofenceTab.maxAltitude')}
              error={maxHeight === undefined}
              helperText={
                maxHeight === undefined &&
                t('safetyDialog.geofenceTab.errors.height')
              }
              InputProps={{
                endAdornment: <InputAdornment position='end'>m</InputAdornment>,
              }}
              variant='standard'
            />
          </Box>

          <FormHeader>
            {t('safetyDialog.geofenceTab.geofencePolygon')}
          </FormHeader>
          {/* TODO: Migrate to `gap={1}` with MUI v5! */}
          <Box display='flex' flexDirection='column' sx={{ gap: '8px' }}>
            <Select
              name='generationMethod'
              label={t('safetyDialog.geofenceTab.fenceGenerationMethodLabel')}
              variant='filled'
            >
              {GEOFENCE_GENERATION_METHODS.map((method) => (
                <MenuItem key={method} value={method}>
                  {describeGeofenceGenerationMethod(method)?.(t)}
                </MenuItem>
              ))}
            </Select>
            <Box display='flex' flexDirection='row' alignItems='baseline'>
              <Checkboxes
                name='simplify'
                disabled={generationMethod === GeofenceGenerationMethod.MANUAL}
                data={{
                  label: t('safetyDialog.geofenceTab.simplifyGeometry'),
                }}
                formControlProps={{ style: { flex: 1 } }}
              />
              <Box p={1} />
              <TextField
                size='small'
                name='maxVertexCount'
                label={t('safetyDialog.geofenceTab.maxVertexCount')}
                disabled={
                  generationMethod === GeofenceGenerationMethod.MANUAL ||
                  !simplify
                }
                type='number'
                InputProps={{
                  inputProps: {
                    min: VERTEX_COUNT_REDUCTION_LOWER_LIMIT,
                    max: VERTEX_COUNT_REDUCTION_UPPER_LIMIT,
                  },
                }}
                variant='filled'
                fieldProps={{ parse: (v) => v.length > 0 && Number(v) }}
                style={{ flex: 1 }}
              />
            </Box>
          </Box>
        </form>
      )}
    </Form>
  );
};

GeofenceSettingsFormPresentation.propTypes = {
  onSubmit: PropTypes.func,
  t: PropTypes.func,
};

/**
 * Container of the form that shows the fields that the user can use to
 * edit the geofence settings.
 */
const GeofenceSettingsForm = connect(
  // mapStateToProps
  null,
  // mapDispatchToProps
  {
    onSubmit: (data) => (dispatch) => {
      dispatch(setGeofenceAction(data.action));
      dispatch(
        updateGeofenceSettings({
          horizontalMargin: data.horizontalMargin,
          verticalMargin: data.verticalMargin,
          generationMethod: data.generationMethod,
          simplify: data.simplify,
          maxVertexCount: data.maxVertexCount,
        })
      );
      if (!(data.generationMethod === GeofenceGenerationMethod.MANUAL)) {
        // TODO: differentiate between convex and concave methods
        dispatch(updateGeofencePolygon());
      }
    },
  }
)(withTranslation()(GeofenceSettingsFormPresentation));

/**
 * Presentation component for the tab that shows the form that the user
 * can use to edit the geofence settings.
 */
const GeofenceSettingsTabPresentation = ({
  hasFence,
  onClose,
  onClearGeofence,
  t,
}) => (
  <>
    <DialogContent>
      <GeofenceSettingsForm />
    </DialogContent>
    <DialogActions>
      <Button color='secondary' disabled={!hasFence} onClick={onClearGeofence}>
        {t('safetyDialog.geofenceTab.clear')}
      </Button>
      <Button form='geofenceSettings' type='submit' color='primary'>
        {t('general.action.apply')}
      </Button>
      <Button onClick={onClose}>{t('general.action.close')}</Button>
    </DialogActions>
  </>
);

GeofenceSettingsTabPresentation.propTypes = {
  hasFence: PropTypes.bool,
  onClearGeofence: PropTypes.func,
  onClose: PropTypes.func,
  t: PropTypes.func,
};

/**
 * Container of the tab that shows the form that the user can use to
 * edit the geofence settings.
 */
const GeofenceSettingsTab = connect(
  // mapStateToProps
  (state) => ({
    hasFence: hasActiveGeofencePolygon(state),
  }),
  // mapDispatchToProps
  {
    onClearGeofence: () => (dispatch, getState) => {
      const geofencePolygonId = getGeofencePolygonId(getState());
      if (geofencePolygonId) {
        dispatch(clearGeofencePolygonId());
        dispatch(removeFeaturesByIds([geofencePolygonId]));
      }
    },
  }
)(withTranslation()(GeofenceSettingsTabPresentation));

export default GeofenceSettingsTab;

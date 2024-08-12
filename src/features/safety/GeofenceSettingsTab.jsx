/**
 * @file Tab that shows the geofence settings and allows the user to edit them.
 */

import { Checkboxes, Select, TextField } from 'mui-rff';
import PropTypes from 'prop-types';
import React from 'react';
import { withTranslation } from 'react-i18next';
import { Form } from 'react-final-form';
import createDecorator from 'final-form-calculate';
import { connect } from 'react-redux';

import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import FormHelperText from '@material-ui/core/FormHelperText';
import InputAdornment from '@material-ui/core/InputAdornment';
import MenuItem from '@material-ui/core/MenuItem';

import FormHeader from '@skybrush/mui-components/lib/FormHeader';

import { removeFeaturesByIds } from '~/features/map-features/slice';
import { updateGeofencePolygon } from '~/features/mission/actions';
import {
  getGeofenceAction,
  getGeofencePolygonId,
  getMaximumDistanceBetweenHomePositionsAndGeofence,
  hasActiveGeofencePolygon,
} from '~/features/mission/selectors';
import {
  clearGeofencePolygonId,
  setGeofenceAction,
} from '~/features/mission/slice';
import {
  createValidator,
  atLeast,
  finite,
  integer,
  required,
} from '~/utils/validation';

import { describeGeofenceAction, GeofenceAction } from './model';
import {
  getGeofenceSettings,
  getMaximumHeightForCurrentMissionType,
  getMaximumHorizontalDistanceForCurrentMissionType,
} from './selectors';
import { updateGeofenceSettings } from './slice';
import { proposeDistanceLimit, proposeHeightLimit } from './utils';

const validator = createValidator({
  horizontalMargin: [required, finite, atLeast(1)],
  verticalMargin: [required, finite, atLeast(1)],
  maxVertexCount: [required, integer, atLeast(3)],
});

const calculator = createDecorator(
  {
    field: 'verticalMargin',
    updates: {
      heightLimit(margin, { maxHeight }) {
        margin = Number.parseFloat(margin);
        return proposeHeightLimit(
          maxHeight,
          Number.isFinite(margin) ? margin : 0
        );
      },
    },
  },
  {
    field: 'horizontalMargin',
    updates: {
      distanceLimit(margin, { maxDistance, maxGeofence }) {
        margin = Number.parseFloat(margin);
        return proposeDistanceLimit(
          Math.max(maxDistance, maxGeofence),
          Number.isFinite(margin) ? margin : 0
        );
      },
    },
  }
);

const SUPPORTED_GEOFENCE_ACTIONS = [
  GeofenceAction.KEEP_CURRENT,
  GeofenceAction.REPORT,
  GeofenceAction.RETURN,
  GeofenceAction.LAND,
];

const GeofenceSettingsFormPresentation = ({ initialValues, onSubmit, t }) => (
  <Form
    initialValues={initialValues}
    validate={validator}
    decorators={[calculator]}
    onSubmit={onSubmit}
  >
    {({
      handleSubmit,
      values: { maxDistance, maxGeofence, maxHeight, simplify },
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
            InputProps={{
              endAdornment: <InputAdornment position='end'>m</InputAdornment>,
            }}
            variant='filled'
          />
          <Box p={1} />
          <TextField
            name='verticalMargin'
            label={t('safetyDialog.geofenceTab.vertical')}
            type='number'
            InputProps={{
              endAdornment: <InputAdornment position='end'>m</InputAdornment>,
            }}
            variant='filled'
          />
        </Box>
        <FormHeader>{t('safetyDialog.geofenceTab.proposedLimits')}</FormHeader>
        <Box display='flex' flexDirection='row'>
          <TextField
            disabled
            name='distanceLimit'
            label={t('safetyDialog.geofenceTab.maxDistance')}
            error={maxDistance === 0 && maxGeofence === 0}
            helperText={
              maxDistance === 0 &&
              maxGeofence === 0 &&
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
            error={maxHeight === 0}
            helperText={
              maxHeight === 0 && t('safetyDialog.geofenceTab.errors.height')
            }
            InputProps={{
              endAdornment: <InputAdornment position='end'>m</InputAdornment>,
            }}
            variant='standard'
          />
        </Box>

        <FormHeader>
          {t('safetyDialog.geofenceTab.vertexCountReduction')}
        </FormHeader>
        <Box display='flex' flexDirection='column'>
          <Checkboxes
            name='simplify'
            data={{ label: t('safetyDialog.geofenceTab.simplifyPolygon') }}
          />
          <TextField
            fullWidth={false}
            name='maxVertexCount'
            label={t('safetyDialog.geofenceTab.maxVertexCount')}
            disabled={!simplify}
            type='number'
            variant='filled'
          />
        </Box>
      </form>
    )}
  </Form>
);

GeofenceSettingsFormPresentation.propTypes = {
  initialValues: PropTypes.object,
  onSubmit: PropTypes.func,
  t: PropTypes.func,
};

/**
 * Container of the form that shows the fields that the user can use to
 * edit the geofence settings.
 */
const GeofenceSettingsForm = connect(
  // mapStateToProps
  (state) => ({
    initialValues: {
      ...getGeofenceSettings(state),
      maxDistance: getMaximumHorizontalDistanceForCurrentMissionType(state),
      maxGeofence: getMaximumDistanceBetweenHomePositionsAndGeofence(state),
      maxHeight: getMaximumHeightForCurrentMissionType(state),
      action: getGeofenceAction(state),
    },
  }),
  // mapDispatchToProps
  {
    onSubmit: (data) => (dispatch) => {
      dispatch(
        updateGeofenceSettings({
          horizontalMargin: Number(data.horizontalMargin),
          verticalMargin: Number(data.verticalMargin),
          simplify: data.simplify,
          maxVertexCount: Number(data.maxVertexCount),
        })
      );
      dispatch(setGeofenceAction(data.action));
      dispatch(updateGeofencePolygon());
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
      {/* <FormHeader>Automatic geofence</FormHeader> */}
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

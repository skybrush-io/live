/**
 * @file Tab that shows the geofence settings and allows the user to edit them.
 */

import { Checkboxes, Select, TextField } from 'mui-rff';
import PropTypes from 'prop-types';
import React from 'react';
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
import {
  getGeofenceAction,
  getGeofencePolygonId,
  hasActiveGeofencePolygon,
} from '~/features/mission/selectors';
import {
  clearGeofencePolygonId,
  setGeofenceAction,
} from '~/features/mission/slice';
import {
  describeGeofenceAction,
  GeofenceAction,
} from '~/features/safety/model';
import {
  getGeofenceSettings,
  getMaximumHeightForCurrentMissionType,
  getMaximumHorizontalDistanceForCurrentMissionType,
} from '~/features/safety/selectors';
import { updateGeofenceSettings } from '~/features/safety/slice';
import {
  proposeDistanceLimit,
  proposeHeightLimit,
} from '~/features/safety/utils';
import { updateGeofencePolygon } from '~/features/show/actions';
import {
  createValidator,
  atLeast,
  finite,
  integer,
  required,
} from '~/utils/validation';

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
      distanceLimit(margin, { maxDistance }) {
        margin = Number.parseFloat(margin);
        return proposeDistanceLimit(
          maxDistance,
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

const GeofenceSettingsFormPresentation = ({ initialValues, onSubmit }) => (
  <Form
    initialValues={initialValues}
    validate={validator}
    decorators={[calculator]}
    onSubmit={onSubmit}
  >
    {({ handleSubmit, values: { simplify } }) => (
      <form id='geofenceSettings' onSubmit={handleSubmit}>
        <FormHeader>Fence action</FormHeader>
        <Box display='flex' flexDirection='column'>
          <Select name='action' label='Primary fence action' variant='filled'>
            {SUPPORTED_GEOFENCE_ACTIONS.map((action) => (
              <MenuItem key={action} value={action}>
                {describeGeofenceAction(action)}
              </MenuItem>
            ))}
          </Select>
          <FormHelperText>
            Support for these options depends on the drones themselves; not all
            options are supported by all drones.
          </FormHelperText>
        </Box>

        <FormHeader>Safety margins</FormHeader>
        <Box display='flex' flexDirection='row'>
          <TextField
            fullWidth={false}
            name='horizontalMargin'
            label='Horizontal'
            type='number'
            InputProps={{
              endAdornment: <InputAdornment position='end'>m</InputAdornment>,
            }}
            variant='filled'
          />
          <Box p={1} />
          <TextField
            fullWidth={false}
            name='verticalMargin'
            label='Vertical'
            type='number'
            InputProps={{
              endAdornment: <InputAdornment position='end'>m</InputAdornment>,
            }}
            variant='filled'
          />
        </Box>
        <FormHeader>Proposed limits for current mission</FormHeader>
        <Box display='flex' flexDirection='row'>
          <TextField
            disabled
            fullWidth={false}
            name='distanceLimit'
            label='Max distance'
            InputProps={{
              endAdornment: <InputAdornment position='end'>m</InputAdornment>,
            }}
            variant='standard'
          />
          <Box p={1} />
          <TextField
            disabled
            fullWidth={false}
            name='heightLimit'
            label='Max altitude'
            InputProps={{
              endAdornment: <InputAdornment position='end'>m</InputAdornment>,
            }}
            variant='standard'
          />
        </Box>

        <FormHeader>Vertex count reduction</FormHeader>
        <Box display='flex' flexDirection='column'>
          <Checkboxes
            name='simplify'
            data={{ label: 'Simplify\u00A0polygon' }}
          />
          <TextField
            fullWidth={false}
            name='maxVertexCount'
            label='Maximum vertex count'
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
      maxHeight: getMaximumHeightForCurrentMissionType(state),
      action: getGeofenceAction(state),
    },
  })
)(GeofenceSettingsFormPresentation);

/**
 * Presentation component for the tab that shows the form that the user
 * can use to edit the geofence settings.
 */
const GeofenceSettingsTabPresentation = ({
  hasFence,
  onClose,
  onClearGeofence,
  onSubmit,
}) => (
  <>
    <DialogContent>
      {/* <FormHeader>Automatic geofence</FormHeader> */}
      <GeofenceSettingsForm onSubmit={onSubmit} />
    </DialogContent>
    <DialogActions>
      <Button color='secondary' disabled={!hasFence} onClick={onClearGeofence}>
        Clear current fence
      </Button>
      <Button form='geofenceSettings' type='submit' color='primary'>
        Apply
      </Button>
      <Button onClick={onClose}>Close</Button>
    </DialogActions>
  </>
);

GeofenceSettingsTabPresentation.propTypes = {
  hasFence: PropTypes.bool,
  onClearGeofence: PropTypes.func,
  onClose: PropTypes.func,
  onSubmit: PropTypes.func,
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
)(GeofenceSettingsTabPresentation);

export default GeofenceSettingsTab;

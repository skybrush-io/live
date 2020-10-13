/**
 * @file Dialog that shows the geofence settings and allows the user to
 * edit them.
 */

import PropTypes from 'prop-types';
import React, { useCallback } from 'react';
import { Form, Field } from 'react-final-form';
import createDecorator from 'final-form-calculate';
import { connect } from 'react-redux';

import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import Divider from '@material-ui/core/Divider';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import InputAdornment from '@material-ui/core/InputAdornment';
import Typography from '@material-ui/core/Typography';

import DialogToolbar from '~/components/dialogs/DialogToolbar';
import FormHeader from '~/components/dialogs/FormHeader';
import { hasActiveGeofencePolygon } from '~/features/mission/selectors';
import { clearGeofencePolygonId } from '~/features/mission/slice';
import { updateGeofencePolygon } from '~/features/show/actions';
import { getHeightLimit } from '~/features/show/selectors';

import {
  closeGeofenceSettingsDialog,
  updateGeofenceSettings,
} from '~/actions/geofence-settings';
import { forceFormSubmission, Switch, TextField } from '~/components/forms';

import { createValidator, finite, integer, required } from '~/utils/validation';

const validator = createValidator({
  horizontalMargin: [required, finite],
  verticalMargin: [required, finite],
  maxVertexCount: [required, integer],
});

const calculator = createDecorator({
  field: 'verticalMargin',
  updates: {
    heightLimit: (verticalMargin, { maxHeight }) =>
      maxHeight + Number(verticalMargin),
  },
});

const GeofenceSettingsFormPresentation = ({
  initialValues,
  onKeyPress,
  onSubmit,
}) => (
  <Form
    initialValues={initialValues}
    validate={validator}
    decorators={[calculator]}
    onSubmit={onSubmit}
  >
    {({ handleSubmit, values: { simplify } }) => (
      <form
        id='geofenceSettings'
        onSubmit={handleSubmit}
        onKeyPress={onKeyPress}
      >
        <FormHeader>Safety margins</FormHeader>
        <Box display='flex' flexDirection='row'>
          <Field
            fullWidth
            name='horizontalMargin'
            label='Horizontal'
            margin='normal'
            component={TextField}
            type='number'
            /* helpertext='(in meters)' */
            InputProps={{
              endAdornment: <InputAdornment position='end'>m</InputAdornment>,
            }}
          />
          <Box p={1} />
          <Field
            fullWidth
            name='verticalMargin'
            label='Vertical'
            margin='normal'
            component={TextField}
            type='number'
            InputProps={{
              endAdornment: <InputAdornment position='end'>m</InputAdornment>,
            }}
          />
          <Box p={1} />
          <Field
            fullWidth
            disabled
            name='heightLimit'
            label='Height limit'
            /* defaultValue='0' */
            margin='normal'
            component={TextField}
            InputProps={{
              endAdornment: <InputAdornment position='end'>m</InputAdornment>,
            }}
            variant='outlined'
          />
        </Box>
        <Box p={1} />
        <Divider />
        <FormHeader>Vertex count reduction</FormHeader>
        <Box display='flex' flexDirection='row'>
          <FormControlLabel
            control={
              <Field name='simplify' type='checkbox' component={Switch} />
            }
            label='Simplify polygon'
            style={{ width: '230px' }}
          />
          <Field
            name='maxVertexCount'
            label='Maximum vertex count'
            margin='normal'
            disabled={!simplify}
            component={TextField}
            type='number'
          />
        </Box>
      </form>
    )}
  </Form>
);

GeofenceSettingsFormPresentation.propTypes = {
  initialValues: PropTypes.object,
  onKeyPress: PropTypes.func,
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
      ...state.dialogs.geofenceSettings,
      maxHeight: state.show.maxHeight || 0,
      heightLimit: getHeightLimit(state),
    },
  })
)(GeofenceSettingsFormPresentation);

/**
 * Presentation component for the dialog that shows the form that the user
 * can use to edit the geofence settings.
 */
const GeofenceSettingsDialogPresentation = ({
  forceFormSubmission,
  hasFence,
  onClose,
  onClearGeofence,
  onSubmit,
  open,
}) => {
  const handleKeyPress = useCallback(
    (event) => {
      if (event.nativeEvent.code === 'Enter') {
        forceFormSubmission();
      }
    },
    [forceFormSubmission]
  );

  return (
    <Dialog fullWidth open={open} maxWidth='xs' onClose={onClose}>
      <DialogToolbar>
        <Typography noWrap variant='subtitle1'>
          Geofence settings
        </Typography>
      </DialogToolbar>
      <DialogContent key='contents'>
        {/* <FormHeader>Automatic geofence</FormHeader> */}
        <GeofenceSettingsForm onSubmit={onSubmit} onKeyPress={handleKeyPress} />
      </DialogContent>
      <DialogActions>
        <Button
          color='secondary'
          disabled={!hasFence}
          onClick={onClearGeofence}
        >
          Clear current fence
        </Button>
        <Button color='primary' onClick={forceFormSubmission}>
          Apply
        </Button>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

GeofenceSettingsDialogPresentation.propTypes = {
  forceFormSubmission: PropTypes.func,
  hasFence: PropTypes.bool,
  onClose: PropTypes.func,
  onSubmit: PropTypes.func,
  open: PropTypes.bool.isRequired,
};

/**
 * Container of the dialog that shows the form that the user can use to
 * edit the geofence settings.
 */
const GeofenceSettingsDialog = connect(
  // mapStateToProps
  (state) => ({
    hasFence: hasActiveGeofencePolygon(state),
    open: state.dialogs.geofenceSettings.dialogVisible,
  }),
  // mapDispatchToProps
  (dispatch) => ({
    forceFormSubmission() {
      forceFormSubmission('geofenceSettings');
    },
    onClearGeofence() {
      dispatch(clearGeofencePolygonId());
    },
    onClose() {
      dispatch(closeGeofenceSettingsDialog());
    },
    onSubmit(data) {
      dispatch(
        updateGeofenceSettings({
          horizontalMargin: Number(data.horizontalMargin),
          verticalMargin: Number(data.verticalMargin),
          simplify: data.simplify,
          maxVertexCount: Number(data.maxVertexCount),
        })
      );
      dispatch(closeGeofenceSettingsDialog());
      dispatch(updateGeofencePolygon());
    },
  })
)(GeofenceSettingsDialogPresentation);

export default GeofenceSettingsDialog;

/**
 * @file Dialog that shows the geofence settings and allows the user to
 * edit them.
 */

import PropTypes from 'prop-types';
import React from 'react';
import { Form, Field } from 'react-final-form';
import { connect } from 'react-redux';

import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Typography from '@material-ui/core/Typography';

import DialogToolbar from '~/components/dialogs/DialogToolbar';
import { updateGeofencePolygon } from '~/features/show/actions';

import {
  closeGeofenceSettingsDialog,
  updateGeofenceSettings,
} from '~/actions/geofence-settings';
import { forceFormSubmission, Switch, TextField } from '~/components/forms';
import { createValidator, integer, number, required } from '~/utils/validation';

const validator = createValidator({
  margin: [required, number],
  maxVertexCount: [required, integer],
});

const GeofenceSettingsFormPresentation = ({
  initialValues,
  onKeyPress,
  onSubmit,
}) => (
  <Form initialValues={initialValues} validate={validator} onSubmit={onSubmit}>
    {({ handleSubmit, values: { simplify } }) => (
      <form
        id='geofenceSettings'
        onSubmit={handleSubmit}
        onKeyPress={onKeyPress}
      >
        <Field
          fullWidth
          name='margin'
          label='Margin'
          margin='normal'
          /* type='number' */
          component={TextField}
        />
        <FormControlLabel
          control={<Field name='simplify' type='checkbox' component={Switch} />}
          label='Simplify the polygon'
        />
        <Field
          fullWidth
          name='maxVertexCount'
          label='Maximum vertex count'
          margin='normal'
          disabled={!simplify}
          component={TextField}
        />
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
    initialValues: state.dialogs.geofenceSettings,
  })
)(GeofenceSettingsFormPresentation);

/**
 * Presentation component for the dialog that shows the form that the user
 * can use to edit the geofence settings.
 */
class GeofenceSettingsDialogPresentation extends React.Component {
  static propTypes = {
    forceFormSubmission: PropTypes.func,
    onClose: PropTypes.func,
    onSubmit: PropTypes.func,
    open: PropTypes.bool.isRequired,
  };

  _handleKeyPress = (event) => {
    if (event.nativeEvent.code === 'Enter') {
      this.props.forceFormSubmission();
    }
  };

  render() {
    const { forceFormSubmission, onClose, onSubmit, open } = this.props;

    return (
      <Dialog fullWidth open={open} maxWidth='xs' onClose={onClose}>
        <DialogToolbar>
          <Typography noWrap variant='subtitle1'>
            Automatic geofence settings
          </Typography>
        </DialogToolbar>
        <DialogContent key='contents'>
          <GeofenceSettingsForm
            onSubmit={onSubmit}
            onKeyPress={this._handleKeyPress}
          />
        </DialogContent>
        <DialogActions>
          <Button key='apply' color='primary' onClick={forceFormSubmission}>
            Apply
          </Button>
          <Button key='cancel' onClick={onClose}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    );
  }
}

/**
 * Container of the dialog that shows the form that the user can use to
 * edit the geofence settings.
 */
const GeofenceSettingsDialog = connect(
  // mapStateToProps
  (state) => ({
    open: state.dialogs.geofenceSettings.dialogVisible,
  }),
  // mapDispatchToProps
  (dispatch) => ({
    forceFormSubmission() {
      forceFormSubmission('geofenceSettings');
    },
    onClose() {
      dispatch(closeGeofenceSettingsDialog());
    },
    onSubmit(data) {
      dispatch(
        updateGeofenceSettings({
          margin: Number(data.margin),
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

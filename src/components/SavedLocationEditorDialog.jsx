/**
 * @file Dialog that shows the editor for a saved location.
 */

import React, { PropTypes } from 'react'
import { connect } from 'react-redux'
import { reduxForm, Field } from 'redux-form'

import Dialog from 'material-ui/Dialog'
import FlatButton from 'material-ui/FlatButton'
import ActionDeleteForever from 'material-ui/svg-icons/action/delete-forever'
import ContentSave from 'material-ui/svg-icons/content/save'

import { updateSavedLocation, deleteSavedLocation } from '../actions/saved-locations'
import { cancelLocationEditing } from '../actions/saved-location-editor'
import { createValidator, between, integer, finite, required } from '../utils/validation'
import { renderTextField } from './helpers/reduxFormRenderers'

import { addListenerToMapViewSignal } from '../signals'

/**
 * Presentation of the form that shows the fields that the user can use to
 * edit the server settings.
 */
class SavedLocationEditorFormPresentation extends React.Component {
  render () {
    return (
      <div onKeyPress={this.props.onKeyPress}>
        <Field
          name={'name'}
          component={renderTextField}
          floatingLabelText={'Name'}
        />
        <br />
        <Field
          name={'center.lon'}
          component={renderTextField}
          floatingLabelText={'Longtitude'}
        />
        <br />
        <Field
          name={'center.lat'}
          component={renderTextField}
          floatingLabelText={'Latitude'}
        />
        <br />
        <Field
          name={'rotation'}
          component={renderTextField}
          floatingLabelText={'Rotation'}
        />
        <br />
        <Field
          name={'zoom'}
          component={renderTextField}
          floatingLabelText={'Zoom level'}
        />
      </div>
    )
  }
}

SavedLocationEditorFormPresentation.propTypes = {
  onKeyPress: PropTypes.func
}

/**
 * Container of the form that shows the fields that the user can use to
 * edit the saved location.
 */
const SavedLocationEditorForm = connect(
  // mapStateToProps
  state => {
    const id = state.dialogs.savedLocationEditor.editedLocationId
    const currentLocation = state.savedLocations.byId[id]

    return { initialValues: currentLocation }
  }, null, null, { withRef: true }
)(reduxForm({
  form: 'SavedLocationEditor',
  validate: createValidator({
    name: required,
    center: createValidator({
      lon: [required, finite, between(-90, 90)],
      lat: [required, finite, between(-180, 180)]
    }),
    rotation: [required, finite, between(0, 360)],
    zoom: [required, integer, between(1, 30)]
  })
})(SavedLocationEditorFormPresentation))

/**
 * Presentation component for the dialog that shows the form that the user
 * can use to edit the saved location.
 */
class SavedLocationEditorDialogPresentation extends React.Component {
  constructor (props) {
    super(props)
    this.handleSubmit = this.handleSubmit.bind(this)
    this._handleKeyPress = this._handleKeyPress.bind(this)
  }

  componentDidMount () {
    addListenerToMapViewSignal.dispatch('center', center => {
      this.props.updateCurrentLocation({center})
    })

    addListenerToMapViewSignal.dispatch('rotation', rotation => {
      this.props.updateCurrentLocation({rotation})
    })

    addListenerToMapViewSignal.dispatch('zoom', zoom => {
      this.props.updateCurrentLocation({zoom})
    })
  }

  handleSubmit () {
    this.refs.form.getWrappedInstance().submit()
  }

  _handleKeyPress (e) {
    if (e.nativeEvent.code === 'Enter') {
      this.handleSubmit()
    }
  }

  render () {
    const { editedLocationId, onClose, onDelete, onSubmit, open } = this.props

    const actions = [
      <FlatButton label={'Save'} primary onTouchTap={this.handleSubmit}
        icon={<ContentSave />} />,
      <FlatButton
        label={'Delete'} secondary disabled={editedLocationId === 'addNew'}
        onTouchTap={onDelete(editedLocationId)} icon={<ActionDeleteForever />}
        />,
      <FlatButton label={'Cancel'} onTouchTap={onClose} />
    ]

    const contentStyle = {
      width: '320px'
    }

    return (
      <Dialog title={'Edit saved location'} open={open}
        actions={actions} contentStyle={contentStyle}
        onRequestClose={onClose}
      >
        <SavedLocationEditorForm ref={'form'}
          onSubmit={onSubmit}
          onKeyPress={this._handleKeyPress} />
      </Dialog>
    )
  }
}

SavedLocationEditorDialogPresentation.propTypes = {
  editedLocationId: PropTypes.string,
  onClose: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  open: PropTypes.bool.isRequired
}

SavedLocationEditorDialogPresentation.defaultProps = {
  open: false
}

/**
 * Container of the dialog that shows the form that the user can use to
 * edit the server settings.
 */
const SavedLocationEditorDialog = connect(
  // mapStateToProps
  state => ({
    open: state.dialogs.savedLocationEditor.dialogVisible,
    editedLocationId: state.dialogs.savedLocationEditor.editedLocationId
  }),
  // mapDispatchToProps
  dispatch => ({
    onClose () {
      dispatch(cancelLocationEditing())
    },
    onDelete (id) {
      return () => {
        dispatch(deleteSavedLocation(id))
        dispatch(cancelLocationEditing())
      }
    },
    onSubmit (data) {
      const currentLocation = JSON.parse(JSON.stringify(data))

      currentLocation.center.lon = Number(currentLocation.center.lon)
      currentLocation.center.lat = Number(currentLocation.center.lat)
      currentLocation.rotation = Number(currentLocation.rotation)
      currentLocation.zoom = Number(currentLocation.zoom)

      dispatch(updateSavedLocation(currentLocation))
      dispatch(cancelLocationEditing())
    },
    updateCurrentLocation (properties) {
      dispatch(updateSavedLocation(
        Object.assign({}, {id: 'current'}, properties)
      ))
    }
  })
)(SavedLocationEditorDialogPresentation)

export default SavedLocationEditorDialog

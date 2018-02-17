/**
* @file React Component for the layer settings dialog.
*/

import { autobind } from 'core-decorators'
import PropTypes from 'prop-types'
import React from 'react'
import { connect } from 'react-redux'
import { reduxForm, Field } from 'redux-form'
import { TextField } from 'redux-form-material-ui'

import Button from 'material-ui/Button'
import Dialog, { DialogActions, DialogContent } from 'material-ui/Dialog'
import IconButton from 'material-ui/IconButton'
import Switch from 'material-ui/Switch'
import ArrowDown from 'material-ui-icons/ArrowDropDown'
import ArrowUp from 'material-ui-icons/ArrowDropUp'

import { adjustLayerZIndex, closeLayersDialog, renameLayer,
  toggleLayerVisibility, removeLayer } from '../../actions/layers'
import { LayerType } from '../../model/layers'
import { createValidator, required } from '../../utils/validation'
import { LayerSettings, stateObjectToLayerSettings } from '../../views/map/layers'

/**
 * Form for the basic settings of a layer that is applicable to all layers
 * regardless of its type.
 */
class BasicLayerSettingsFormPresentation extends React.Component {
  render () {
    const { layer } = this.props
    const { onToggleLayerVisibility } = this.props

    return (
      <div style={{ display: 'flex', paddingBottom: '1em' }}>
        <Field
          name='label'
          component={TextField}
          label='Layer name'
          placeholder='New layer'
          style={{ flex: 'auto' }}
          onKeyDown={this._onKeyDown}
        />
        <div>&nbsp;</div>
        <Switch checked={layer.visible}
          disabled={layer.type === LayerType.UNTYPED}
          onChange={onToggleLayerVisibility}
          style={{ flex: 'none' }}
        />
      </div>
    )
  }

  /**
   * Function to accept the field's value when Enter is pressed.
   *
   * @param {Event} e the event fired from the TextField React component
   */
  _onKeyDown (e) {
    if (e.key === 'Enter') {
      e.target.blur()
    }
  }
}

BasicLayerSettingsFormPresentation.propTypes = {
  layer: PropTypes.object,
  layerId: PropTypes.string,

  onToggleLayerVisibility: PropTypes.func
}

/**
 * Container of the form that shows the fields that the user can use to
 * edit the basic settings of a layer.
 */
const BasicLayerSettingsForm = connect(
  // mapStateToProps
  (state, ownProps) => ({
    initialValues: {
      label: ownProps.layer.label
    }
  }),
  // mapDispatchToProps
  (dispatch, ownProps) => ({
    asyncValidate: values => {
      // This is a horrible abuse of the async validation feature in
      // redux-form; basically the only thing we want is to fire a callback
      // routine if the synchronous validation of the label field passed
      // so we can fire an action that updates the name of the layer.
      dispatch(renameLayer(ownProps.layerId, values.label))

      // This function needs to return a Promise so we create one
      return Promise.resolve()
    },
    asyncBlurFields: ['label'],

    // ensure that the base layer name is updated when the user changes the selected layer
    enableReinitialize: true,

    onToggleLayerVisibility () {
      dispatch(toggleLayerVisibility(ownProps.layerId))
    }
  })
)(reduxForm(
  // config
  {
    form: 'basicLayerSettings',
    validate: createValidator({
      label: required
    })
  }
)(BasicLayerSettingsFormPresentation))

/* ********************************************************************* */

/**
 * Presentation component for the settings of a layer.
 */
class LayerSettingsContainerPresentation extends React.Component {
  /**
   * Creates the child components that allows the user to update the
   * layer-specific settings of the selected layer.
   *
   * @param {Object} layer  the layer being edited
   * @param {string} layerId  the identifier of the layer being edited
   * @return {Object[]}  the list of child components to add
   */
  createChildrenForLayer (layer, layerId) {
    if (layer.type in LayerSettings) {
      return stateObjectToLayerSettings(layer, layerId)
    } else {
      return []
    }
  }

  render () {
    const { layer, layerId } = this.props

    if (!layerId) {
      // No layer is selected; let's show a hint that the user should
      // select a layer
      return (
        <div style={{ textAlign: 'center', marginTop: '2em' }}>
          Please select a layer from the layer list.
        </div>
      )
    }

    if (typeof layer === 'undefined') {
      // A layer is selected by the user but the layer does not exist
      // any more. We just bail out silently.
      return false
    }

    // The returned div must have a key to ensure that the forms in
    // the div are unmounted and then re-mounted when the selected
    // layer changes. Otherwise some of the forms could be updated
    // in-place by React, which could cause dirty values to stay in
    // the form fields even if the layer selection changes
    return (
      <div key={'settings_' + layerId}>
        <BasicLayerSettingsForm layer={layer} layerId={layerId} />
        {this.createChildrenForLayer(layer, layerId)}
      </div>
    )
  }
}

LayerSettingsContainerPresentation.propTypes = {
  layer: PropTypes.object,
  layerId: PropTypes.string,

  onLayerSourceChanged: PropTypes.func
}

/**
 * Container of the panel that contains the settings of a layer.
 */
const LayerSettingsContainer = connect(
  // mapStateToProps
  (state, ownProps) => ({
    layer: state.map.layers.byId[ownProps.layerId]
  }),
  // mapDispatchToProps
  (dispatch, ownProps) => ({})
)(LayerSettingsContainerPresentation)

/* ********************************************************************* */

/**
 * Presentation component for the dialog that shows the settings of
 * a selected layer.
 */
class LayerSettingsDialogPresentation extends React.Component {
  render () {
    const { canMoveUp, canMoveDown, dialogVisible, selectedLayerId } = this.props
    const { onClose } = this.props
    const actions = []

    if (selectedLayerId) {
      actions.push(
        <IconButton key='moveUp' disabled={!canMoveUp} onClick={this._moveSelectedLayerUp}>
          <ArrowUp />
        </IconButton>,
        <IconButton key='moveDown' disabled={!canMoveDown} onClick={this._moveSelectedLayerDown}>
          <ArrowDown />
        </IconButton>,
        <Button key='remove' color='secondary' onClick={this._removeSelectedLayer}>Remove</Button>
      )
    }

    actions.push(
      <Button key='close' color='primary' onClick={onClose}>Close</Button>
    )

    return (
      <Dialog fullWidth maxWidth='md' open={dialogVisible} onClose={onClose}>
        <DialogContent style={{ overflow: 'auto' }}>
          <LayerSettingsContainer layerId={selectedLayerId} />
        </DialogContent>
        <DialogActions>
          {actions}
        </DialogActions>
      </Dialog>
    )
  }

  @autobind
  _moveSelectedLayer (delta) {
    const { selectedLayerId, onMoveLayer } = this.props
    onMoveLayer(selectedLayerId, delta)
  }

  @autobind
  _moveSelectedLayerDown () {
    this._moveSelectedLayer(-1)
  }

  @autobind
  _moveSelectedLayerUp () {
    this._moveSelectedLayer(1)
  }

  @autobind
  _removeSelectedLayer () {
    const { selectedLayerId, onRemoveLayer } = this.props
    onRemoveLayer(selectedLayerId)
  }
}

LayerSettingsDialogPresentation.propTypes = {
  canMoveDown: PropTypes.bool.isRequired,
  canMoveUp: PropTypes.bool.isRequired,
  dialogVisible: PropTypes.bool.isRequired,
  selectedLayerId: PropTypes.string,

  onClose: PropTypes.func,
  onMoveLayer: PropTypes.func,
  onRemoveLayer: PropTypes.func
}

LayerSettingsDialogPresentation.defaultProps = {
  dialogVisible: false
}

/**
 * Container of the dialog that allows the user to configure the layers of
 * the map.
 */
const LayerSettingsDialog = connect(
  // mapStateToProps
  state => {
    const { layerSettings } = state.dialogs
    const { order } = state.map.layers
    const { dialogVisible, selectedLayer } = layerSettings
    const layerIndex = selectedLayer && order ? order.indexOf(selectedLayer) : -1
    return {
      canMoveDown: layerIndex > 0,
      canMoveUp: layerIndex >= 0 && layerIndex < order.length - 1,
      dialogVisible: dialogVisible,
      selectedLayerId: selectedLayer
    }
  },
  // mapDispatchToProps
  dispatch => ({
    /*
    onAddLayer () {
      const action = addLayer()
      dispatch(action)
      if (action.layerId) {
        dispatch(setSelectedLayerInLayersDialog(action.layerId))
      }
    },
    */

    onClose () {
      dispatch(closeLayersDialog())
    },

    onMoveLayer (layerId, delta) {
      dispatch(adjustLayerZIndex(layerId, delta))
    },

    onRemoveLayer (layerId) {
      dispatch(removeLayer(layerId))
    }
  })
)(LayerSettingsDialogPresentation)

export default LayerSettingsDialog

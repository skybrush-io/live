/**
* @file React Component for the layer settings dialog.
*/

import React, { PropTypes } from 'react'
import { connect } from 'react-redux'
import { reduxForm, Field } from 'redux-form'

import Dialog from 'material-ui/Dialog'
import FlatButton from 'material-ui/FlatButton'
import IconButton from 'material-ui/IconButton'
import { List, ListItem } from 'material-ui/List'
import Toggle from 'material-ui/Toggle'
import VisibilityOff from 'material-ui/svg-icons/action/visibility-off'
import ContentAdd from 'material-ui/svg-icons/content/add'
import ContentRemove from 'material-ui/svg-icons/content/remove'
import ArrowDown from 'material-ui/svg-icons/navigation/arrow-drop-down'
import ArrowUp from 'material-ui/svg-icons/navigation/arrow-drop-up'

import { adjustLayerZIndex, closeLayersDialog, renameLayer,
         setSelectedLayerInLayersDialog, toggleLayerVisibility,
         addLayer, removeLayer } from '../../actions/layers'
import { selectableListOf } from '../helpers/lists'
import { LayerType, labelForLayerType, iconForLayerType } from '../../model/layers'
import { createValidator, required } from '../../utils/validation'
import { renderTextField } from '../helpers/reduxFormRenderers'

/**
 * Form for the basic settings of a layer that is applicable to all layers
 * regardless of its type.
 */
class BasicLayerSettingsFormPresentation extends React.Component {
  render () {
    const { layer } = this.props
    const { onToggleLayerVisibility } = this.props

    return (
      <div style={{ paddingBottom: '1em' }}>
        <Field
          name={'label'}
          component={renderTextField}
          floatingLabelText={'Layer name'}
          hintText={'New layer'}
          style={{ width: '100%' }}
          onKeyDown={this._onKeyDown}
        />
        <div>&nbsp;</div>
        <Toggle label={'Visible'} labelPosition={'right'}
          toggled={layer.visible}
          disabled={layer.type === LayerType.UNTYPED}
          onToggle={onToggleLayerVisibility}
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

import { LayerSettings, stateObjectToLayerSettings } from './layers/index.js'

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

    return (
      <div>
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
 * Presentation component for a list that shows the currently added layers.
 */
const LayerListPresentation = selectableListOf(
  (layer, props, selected) => (
    <ListItem key={layer.id} primaryText={layer.label}
      secondaryText={labelForLayerType(layer.type)}
      leftIcon={iconForLayerType(layer.type)}
      rightIcon={layer.visible ? undefined : <VisibilityOff />}
      className={selected ? 'selected-list-item' : undefined}
      onTouchTap={props.onItemSelected}
            />
  ),
  {
    backgroundHint: 'No layers',
    dataProvider: 'layers',
    /* eslint-disable react/display-name */
    listFactory: (props, children) => (
      <List className={'dialog-sidebar'}>
        {children}
      </List>
    )
    /* eslint-enable react/display-name */
  }
)

LayerListPresentation.propTypes = {
  layers: PropTypes.arrayOf(PropTypes.object).isRequired,
  value: PropTypes.string,
  onChange: PropTypes.func
}

/**
 * Container for the layer list that binds it to the Redux store.
 */
const LayerList = connect(
  // mapStateToProps
  state => {
    const { byId, order } = state.map.layers
    return {
      layers: order.map(layerId => byId[layerId]),
      value: state.dialogs.layerSettings.selectedLayer
    }
  },
  // mapDispatchToProps
  dispatch => ({
    onChange (event, layerId) {
      dispatch(setSelectedLayerInLayersDialog(layerId))
    }
  })
)(LayerListPresentation)

/* ********************************************************************* */

/**
 * Presentation component for the dialog that shows the configuration of
 * layers in the map.
 */
class LayersDialogPresentation extends React.Component {
  constructor (props) {
    super(props)
    this._moveSelectedLayerDown = this._moveSelectedLayerDown.bind(this)
    this._moveSelectedLayerUp = this._moveSelectedLayerUp.bind(this)
    this._removeSelectedLayer = this._removeSelectedLayer.bind(this)
  }

  render () {
    const { canMoveUp, canMoveDown, dialogVisible, selectedLayerId } = this.props
    const { onAddLayer, onClose } = this.props
    const actions = [
      <IconButton onTouchTap={onAddLayer}>
        <ContentAdd />
      </IconButton>,
      <IconButton disabled={!selectedLayerId}
        onTouchTap={this._removeSelectedLayer}>
        <ContentRemove />
      </IconButton>,
      <IconButton disabled={!canMoveUp}
        onTouchTap={this._moveSelectedLayerUp}>
        <ArrowUp />
      </IconButton>,
      <IconButton disabled={!canMoveDown}
        onTouchTap={this._moveSelectedLayerDown}>
        <ArrowDown />
      </IconButton>,
      <div style={{ flex: 1 }} />,
      <FlatButton label='Done' primary onTouchTap={onClose} />
    ]

    return (
      <Dialog
        open={dialogVisible}
        actions={actions}
        bodyStyle={{display: 'flex', overflow: 'visible'}}
        actionsContainerStyle={{ display: 'flex', alignItems: 'center' }}
        onRequestClose={onClose}
      >
        <div style={{ flex: 3 }}>
          <LayerList />
        </div>
        <div style={{ flex: 7, marginLeft: 15 }}>
          <LayerSettingsContainer layerId={selectedLayerId} />
        </div>
      </Dialog>
    )
  }

  _moveSelectedLayer (delta) {
    const { selectedLayerId, onMoveLayer } = this.props
    onMoveLayer(selectedLayerId, delta)
  }

  _moveSelectedLayerDown () {
    this._moveSelectedLayer(1)
  }

  _moveSelectedLayerUp () {
    this._moveSelectedLayer(-1)
  }

  _removeSelectedLayer () {
    const { selectedLayerId, onRemoveLayer } = this.props
    onRemoveLayer(selectedLayerId)
  }
}

LayersDialogPresentation.propTypes = {
  canMoveDown: PropTypes.bool.isRequired,
  canMoveUp: PropTypes.bool.isRequired,
  dialogVisible: PropTypes.bool.isRequired,
  selectedLayerId: PropTypes.string,

  onClose: PropTypes.func,
  onAddLayer: PropTypes.func,
  onMoveLayer: PropTypes.func,
  onRemoveLayer: PropTypes.func
}

LayersDialogPresentation.defaultProps = {
  dialogVisible: false
}

/**
 * Container of the dialog that allows the user to configure the layers of
 * the map.
 */
const LayersDialog = connect(
  // mapStateToProps
  state => {
    const { layerSettings } = state.dialogs
    const { order } = state.map.layers
    const { dialogVisible, selectedLayer } = layerSettings
    const layerIndex = selectedLayer && order ? order.indexOf(selectedLayer) : -1
    return {
      canMoveUp: layerIndex > 0,
      canMoveDown: layerIndex < order.length - 1,
      dialogVisible: dialogVisible,
      selectedLayerId: selectedLayer
    }
  },
  // mapDispatchToProps
  dispatch => ({
    onAddLayer () {
      const action = addLayer()
      dispatch(action)
      if (action.layerId) {
        dispatch(setSelectedLayerInLayersDialog(action.layerId))
      }
    },

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
)(LayersDialogPresentation)

export default LayersDialog

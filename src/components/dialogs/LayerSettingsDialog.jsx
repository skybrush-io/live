/**
 * @file React component for the layer settings dialog.
 */

import { TextField } from 'mui-rff';
import PropTypes from 'prop-types';
import React from 'react';
import { Form } from 'react-final-form';
import { connect } from 'react-redux';

import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import IconButton from '@material-ui/core/IconButton';
import Switch from '@material-ui/core/Switch';
import ArrowDown from '@material-ui/icons/ArrowDropDown';
import ArrowUp from '@material-ui/icons/ArrowDropUp';

import BackgroundHint from '@skybrush/mui-components/lib/BackgroundHint';
import DraggableDialog from '@skybrush/mui-components/lib/DraggableDialog';

import { forceFormSubmission } from '../forms';

import { closeLayerSettingsDialog } from '~/features/map/layer-settings-dialog';
import {
  adjustLayerZIndex,
  renameLayer,
  toggleLayerVisibility,
  removeLayer,
} from '~/features/map/layers';
import { LayerType } from '~/model/layers';
import { createValidator, required } from '~/utils/validation';
import { LayerSettings, stateObjectToLayerSettings } from '~/views/map/layers';
import { getLayers, getLicensedLayerById } from '~/selectors/layers';

const validator = createValidator({
  label: required,
});

/**
 * Form for the basic settings of a layer that is applicable to all layers
 * regardless of its type.
 */
const BasicLayerSettingsFormPresentation = ({
  initialValues,
  layer,
  onSubmit,
  onToggleLayerVisibility,
  validate,
}) => (
  <Form
    validateOnBlur
    initialValues={initialValues}
    validate={validate}
    onSubmit={onSubmit}
  >
    {({ handleSubmit }) => (
      <form id='basicLayerSettings' onSubmit={handleSubmit}>
        <Box display='flex' alignItems='center' pb={2}>
          <TextField
            name='label'
            variant='filled'
            label='Layer name'
            placeholder='New layer'
            style={{ flex: 'auto' }}
          />
          <div>&nbsp;</div>
          <Switch
            checked={layer.visible}
            color='primary'
            disabled={
              layer.type === LayerType.UNAVAILABLE ||
              layer.type === LayerType.UNTYPED
            }
            style={{ flex: 'none' }}
            onChange={onToggleLayerVisibility}
          />
        </Box>
      </form>
    )}
  </Form>
);

BasicLayerSettingsFormPresentation.propTypes = {
  layer: PropTypes.shape({
    visible: PropTypes.bool,
    type: PropTypes.string,
  }),
  initialValues: PropTypes.object,
  validate: PropTypes.func,
  onSubmit: PropTypes.func,
  onToggleLayerVisibility: PropTypes.func,
};

/**
 * Container of the form that shows the fields that the user can use to
 * edit the basic settings of a layer.
 */
const BasicLayerSettingsForm = connect(
  // mapStateToProps
  (state, ownProps) => ({
    initialValues: {
      label: ownProps.layer.label,
    },
  }),
  // mapDispatchToProps
  (dispatch, ownProps) => ({
    onSubmit(values) {
      dispatch(renameLayer(ownProps.layerId, values.label));
    },

    validate(values) {
      const result = validator(values);

      if (result === undefined || Object.keys(result).length === 0) {
        // This is a horrible abuse of the async validation feature in
        // react-final-form; basically the only thing we want is to fire a
        // callback routine if the synchronous validation of the label field
        // passed so we can fire an action that updates the name of the layer.
        forceFormSubmission('basicLayerSettings');
      }

      return result;
    },

    onToggleLayerVisibility() {
      dispatch(toggleLayerVisibility(ownProps.layerId));
    },
  })
)(BasicLayerSettingsFormPresentation);

/* ********************************************************************* */

/**
 * Presentation component for the settings of a layer.
 */
class LayerSettingsContainerPresentation extends React.Component {
  static propTypes = {
    layer: PropTypes.object,
    layerId: PropTypes.string,
  };

  /**
   * Creates the child components that allows the user to update the
   * layer-specific settings of the selected layer.
   *
   * @param {Object} layer  the layer being edited
   * @param {string} layerId  the identifier of the layer being edited
   * @return {Object[]}  the list of child components to add
   */
  createChildrenForLayer(layer, layerId) {
    if (layer.type in LayerSettings) {
      return stateObjectToLayerSettings(layer, layerId);
    } else {
      return [
        <div key='_hint' style={{ position: 'relative', height: 48 }}>
          <BackgroundHint text='This layer has no additional settings.' />
        </div>,
      ];
    }
  }

  render() {
    const { layer, layerId } = this.props;

    if (!layerId) {
      // No layer is selected; let's show a hint that the user should
      // select a layer
      return (
        <div
          key='_hint'
          style={{ position: 'relative', height: 48, marginTop: '2em' }}
        >
          <BackgroundHint
            text='Please select a layer from the layer list.'
            style={{ marginTop: '2em' }}
          />
        </div>
      );
    }

    if (typeof layer === 'undefined') {
      // A layer is selected by the user but the layer does not exist
      // any more. We just bail out silently.
      return false;
    }

    // The returned div must have a key to ensure that the forms in
    // the div are unmounted and then re-mounted when the selected
    // layer changes. Otherwise some of the forms could be updated
    // in-place by React, which could cause dirty values to stay in
    // the form fields even if the layer selection changes
    return (
      <div key={'settings_' + layerId}>
        {layer.type === LayerType.UNTYPED ? null : (
          <BasicLayerSettingsForm layer={layer} layerId={layerId} />
        )}
        {this.createChildrenForLayer(layer, layerId)}
      </div>
    );
  }
}

/**
 * Container of the panel that contains the settings of a layer.
 */
const LayerSettingsContainer = connect(
  // mapStateToProps
  (state, ownProps) => ({
    layer: getLicensedLayerById(ownProps.layerId)(state),
  }),
  // mapDispatchToProps
  {}
)(LayerSettingsContainerPresentation);

/* ********************************************************************* */

/**
 * Presentation component for the dialog that shows the settings of
 * a selected layer.
 */
class LayerSettingsDialogPresentation extends React.Component {
  static propTypes = {
    canMoveDown: PropTypes.bool.isRequired,
    canMoveUp: PropTypes.bool.isRequired,
    dialogVisible: PropTypes.bool.isRequired,
    selectedLayerId: PropTypes.string,

    onClose: PropTypes.func,
    onMoveLayer: PropTypes.func,
    onRemoveLayer: PropTypes.func,
  };

  render() {
    const { canMoveUp, canMoveDown, dialogVisible, selectedLayerId } =
      this.props;
    const { onClose } = this.props;
    const actions = [];

    if (selectedLayerId) {
      actions.push(
        <IconButton
          key='moveUp'
          disabled={!canMoveUp}
          onClick={this._moveSelectedLayerUp}
        >
          <ArrowUp />
        </IconButton>,
        <IconButton
          key='moveDown'
          disabled={!canMoveDown}
          onClick={this._moveSelectedLayerDown}
        >
          <ArrowDown />
        </IconButton>,
        <Button
          key='remove'
          color='secondary'
          onClick={this._removeSelectedLayer}
        >
          Remove
        </Button>
      );
    }

    actions.push(
      <Button key='close' color='primary' onClick={onClose}>
        Close
      </Button>
    );

    return (
      <DraggableDialog
        fullWidth
        maxWidth='sm'
        open={dialogVisible}
        onClose={onClose}
      >
        <DialogContent style={{ overflow: 'auto' }}>
          <LayerSettingsContainer layerId={selectedLayerId} />
        </DialogContent>
        <DialogActions>{actions}</DialogActions>
      </DraggableDialog>
    );
  }

  _moveSelectedLayer = (delta) => {
    const { selectedLayerId, onMoveLayer } = this.props;
    onMoveLayer(selectedLayerId, delta);
  };

  _moveSelectedLayerDown = () => {
    this._moveSelectedLayer(-1);
  };

  _moveSelectedLayerUp = () => {
    this._moveSelectedLayer(1);
  };

  _removeSelectedLayer = () => {
    const { selectedLayerId, onRemoveLayer } = this.props;
    onRemoveLayer(selectedLayerId);
  };
}

/**
 * Container of the dialog that allows the user to configure the layers of
 * the map.
 */
const LayerSettingsDialog = connect(
  // mapStateToProps
  (state) => {
    const { layerSettings } = state.dialogs;
    const { order } = getLayers(state);
    const { dialogVisible, selectedLayer } = layerSettings;
    const layerIndex =
      selectedLayer && order ? order.indexOf(selectedLayer) : -1;
    return {
      canMoveDown: layerIndex > 0,
      canMoveUp: layerIndex >= 0 && layerIndex < order.length - 1,
      dialogVisible,
      selectedLayerId: selectedLayer,
    };
  },
  // mapDispatchToProps
  {
    onClose: () => (dispatch, getState) => {
      const state = getState();
      const { layerSettings } = state.dialogs;
      const { selectedLayer: selectedLayerId } = layerSettings || {};
      const selectedLayer = selectedLayerId
        ? getLicensedLayerById(selectedLayerId)(state)
        : undefined;

      if (selectedLayer && selectedLayer.type === LayerType.UNTYPED) {
        dispatch(removeLayer(selectedLayerId));
      }

      dispatch(closeLayerSettingsDialog());
    },
    onMoveLayer: adjustLayerZIndex,
    onRemoveLayer: removeLayer,
  }
)(LayerSettingsDialogPresentation);

export default LayerSettingsDialog;

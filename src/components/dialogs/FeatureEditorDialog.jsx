import PropTypes from 'prop-types'
import React from 'react'
import { connect } from 'react-redux'

import AppBar from '@material-ui/core/AppBar'
import Button from '@material-ui/core/Button'
import Dialog from '@material-ui/core/Dialog'
import DialogActions from '@material-ui/core/DialogActions'
import DialogContent from '@material-ui/core/DialogContent'
import Switch from '@material-ui/core/Switch'
import Tab from '@material-ui/core/Tab'
import Tabs from '@material-ui/core/Tabs'
import TextField from '@material-ui/core/TextField'

import {
  removeFeature,
  renameFeature,
  setFeatureColor,
  updateFeatureVisibility
} from '../../actions/features'
import {
  closeFeatureEditorDialog,
  setFeatureEditorDialogTab
} from '../../actions/feature-editor'
import CircleColorPicker from '../../components/CircleColorPicker'
import { primaryColor } from '../../utils/styles'

const GeneralPropertiesFormPresentation = ({
  feature, onSetFeatureColor, onSetFeatureLabel, onToggleFeatureVisibility
}) => (
  <div>
    <div style={{ display: 'flex', padding: '1em 0' }}>
      <div style={{ flex: 'auto' }}>
        <TextField autoFocus label='Label' value={feature.label || ''} fullWidth
          onChange={onSetFeatureLabel} />
      </div>
      <Switch
        checked={feature.visible} color='primary'
        onChange={onToggleFeatureVisibility}
        style={{ flex: 'none' }}
      />
    </div>
    <div>
      <CircleColorPicker value={feature.color || primaryColor}
        onChangeComplete={onSetFeatureColor} />
    </div>
  </div>
)

GeneralPropertiesFormPresentation.propTypes = {
  feature: PropTypes.object.isRequired,
  featureId: PropTypes.string.isRequired,
  onSetFeatureColor: PropTypes.func,
  onSetFeatureLabel: PropTypes.func,
  onToggleFeatureVisibility: PropTypes.func
}

const GeneralPropertiesForm = connect(
  // mapStateToProps
  null,
  // mapDispatchToProps
  (dispatch, { featureId }) => ({
    onSetFeatureColor (color) {
      dispatch(setFeatureColor(featureId, color.hex))
    },
    onSetFeatureLabel (event) {
      dispatch(renameFeature(featureId, event.target.value))
    },
    onToggleFeatureVisibility (event, checked) {
      dispatch(updateFeatureVisibility(featureId, checked))
    }
  })
)(GeneralPropertiesFormPresentation)

const FeatureEditorDialogPresentation = props => {
  const {
    feature, featureId, onClose, onRemoveFeature, onTabSelected,
    open, selectedTab
  } = props
  const actions = []
  let content

  if (!feature) {
    content = <DialogContent><p>Feature does not exist</p></DialogContent>
  } else {
    switch (selectedTab) {
      case 'general':
        content = (
          <DialogContent>
            <GeneralPropertiesForm feature={feature} featureId={featureId} />
          </DialogContent>
        )
        break

      default:
        content = <DialogContent><p>Not implemented yet</p></DialogContent>
    }
  }

  actions.push(
    <Button key='remove' color='secondary' onClick={onRemoveFeature}
      disabled={!feature}>Remove</Button>,
    <Button key='close' onClick={onClose}>Close</Button>
  )

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth='xs'>
      <AppBar position='static'>
        <Tabs value={selectedTab} onChange={onTabSelected} variant="fullWidth">
          <Tab value='general' label="General" />
          <Tab value='points' label="Points" />
        </Tabs>
      </AppBar>
      {content}
      <DialogActions>
        {actions}
      </DialogActions>
    </Dialog>
  )
}

FeatureEditorDialogPresentation.propTypes = {
  feature: PropTypes.object,
  featureId: PropTypes.string,
  onClose: PropTypes.func,
  onRemoveFeature: PropTypes.func,
  onSubmit: PropTypes.func,
  onTabSelected: PropTypes.func,
  open: PropTypes.bool.isRequired,
  selectedTab: PropTypes.string
}

FeatureEditorDialogPresentation.defaultProps = {
  open: false,
  selectedTab: 'general'
}

/**
 * Container of the dialog that shows the form where a given feature can
 * be edited.
 */
const FeatureEditorDialog = connect(
  // mapStateToProps
  state => {
    const { dialogVisible, featureId, selectedTab } = state.dialogs.featureEditor
    return {
      featureId,
      selectedTab,
      feature: state.features.byId[featureId],
      open: dialogVisible
    }
  },
  // mapDispatchToProps
  dispatch => ({
    onClose () {
      dispatch(closeFeatureEditorDialog())
    },
    onRemoveFeature (featureId) {
      dispatch(removeFeature(featureId))
      dispatch(closeFeatureEditorDialog())
    },
    onTabSelected (event, value) {
      dispatch(setFeatureEditorDialogTab(value))
    }
  }),
  // mergeProps
  (stateProps, dispatchProps) => ({
    ...stateProps,
    ...dispatchProps,
    onRemoveFeature: () => dispatchProps.onRemoveFeature(stateProps.featureId)
  })
)(FeatureEditorDialogPresentation)

export default FeatureEditorDialog

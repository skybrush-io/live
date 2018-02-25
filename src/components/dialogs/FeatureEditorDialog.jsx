import PropTypes from 'prop-types'
import React from 'react'
import { connect } from 'react-redux'
import { reduxForm, submit, Field } from 'redux-form'
import { Switch, TextField } from 'redux-form-material-ui'

import AppBar from 'material-ui/AppBar'
import Button from 'material-ui/Button'
import Dialog, { DialogActions, DialogContent } from 'material-ui/Dialog'
import PureSwitch from 'material-ui/Switch'
import Tabs, { Tab } from 'material-ui/Tabs'

import {
  closeFeatureEditorDialog,
  setFeatureEditorDialogTab
} from '../../actions/feature-editor'


const GeneralPropertiesFormPresentation = ({ feature, onToggleFeatureVisibility }) => (
  <div>
    <div style={{ display: 'flex', padding: '1em 0' }}>
      <Field name='label' label='Label' style={{ flex: 'auto' }}
        component={TextField} fullWidth />
      <div>&nbsp;</div>
      <PureSwitch checked={feature.visible} color='primary'
        onChange={onToggleFeatureVisibility}
        style={{ flex: 'none' }}
      />
    </div>
  </div>
)

GeneralPropertiesFormPresentation.propTypes = {
  feature: PropTypes.object.isRequired,
  onToggleFeatureVisibility: PropTypes.func
}

const GeneralPropertiesForm = connect(
  // mapStateToProps
  state => {
    const feature = state.features.byId[state.dialogs.featureEditor.featureId]
    return {
      feature,
      initialValues: {
        label: feature.label
      }
    }
  },
  // mapDispatchToProps
  dispatch => ({
  })
)(
  reduxForm({
    enableReinitialize: true,
    form: 'generalFeatureSettings'
  })(GeneralPropertiesFormPresentation)
)

const FeatureEditorDialogPresentation = props => {
  const actions = []
  let content

  switch (props.selectedTab) {
    case 'general':
      content = <DialogContent><GeneralPropertiesForm /></DialogContent>
      break

    default:
      content = <DialogContent><p>Not implemented yet</p></DialogContent>
  }

  actions.push(<Button key='close' onClick={props.onClose}>Close</Button>)

  return (
    <Dialog open={props.open} onClose={props.onClose} fullWidth maxWidth='xs'>
      <AppBar position='static'>
        <Tabs value={props.selectedTab} onChange={props.onTabSelected} fullWidth>
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
  featureId: PropTypes.string,
  onClose: PropTypes.func,
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
  state => ({
    featureId: state.dialogs.featureEditor.featureId,
    open: state.dialogs.featureEditor.dialogVisible,
    selectedTab: state.dialogs.featureEditor.selectedTab
  }),
  // mapDispatchToProps
  dispatch => ({
    onClose () {
      dispatch(closeFeatureEditorDialog())
    },
    onTabSelected (event, value) {
      dispatch(setFeatureEditorDialogTab(value))
    }
  })
)(FeatureEditorDialogPresentation)

export default FeatureEditorDialog

import PropTypes from 'prop-types'
import React from 'react'
import { connect } from 'react-redux'

import Checkbox from 'material-ui/Checkbox'
import { FormControlLabel, FormGroup } from 'material-ui/Form'

import {
  updateAppSettings
} from '../../../actions/app-settings'

const DisplayTabPresentation = props => (
  <FormGroup>
    <FormControlLabel label="Show mouse coordinates"
      control={<Checkbox checked={props.showMouseCoordinates}
        name='showMouseCoordinates'
        onChange={props.onCheckboxToggled} />} />
    <FormControlLabel label="Show scale line"
      control={<Checkbox checked={props.showScaleLine}
        name='showScaleLine'
        onChange={props.onCheckboxToggled} />} />
  </FormGroup>
)

DisplayTabPresentation.propTypes = {
  onCheckboxToggled: PropTypes.func,
  showMouseCoordinates: PropTypes.bool,
  showScaleLine: PropTypes.bool
}

export default connect(
  // mapStateToProps
  state => state.settings.display,
  // mapDispatchToProps
  dispatch => ({
    onCheckboxToggled (event) {
      dispatch(updateAppSettings(
        'display',
        { [event.target.name]: event.target.checked }
      ))
    }
  })
)(DisplayTabPresentation)

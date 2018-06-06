import PropTypes from 'prop-types'
import React from 'react'
import { connect } from 'react-redux'

import Checkbox from '@material-ui/core/Checkbox'
import FormControlLabel from '@material-ui/core/FormControlLabel'
import FormGroup from '@material-ui/core/FormGroup'

import { updateAppSettings } from '../../../actions/app-settings'
import { setHomePosition } from '../../../actions/map-origin'
import { CoordinateField } from '../../CoordinateField'

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
    <CoordinateField label="Home position"
      value={props.homePosition}
      onChange={props.onHomePositionChanged}
    />
  </FormGroup>
)

DisplayTabPresentation.propTypes = {
  homePosition: PropTypes.arrayOf(PropTypes.number),
  onCheckboxToggled: PropTypes.func,
  onHomePositionChanged: PropTypes.func,
  showMouseCoordinates: PropTypes.bool,
  showScaleLine: PropTypes.bool
}

export default connect(
  // mapStateToProps
  state => ({
    homePosition: state.map.origin.position,
    ...state.settings.display
  }),
  // mapDispatchToProps
  dispatch => ({
    onCheckboxToggled (event) {
      dispatch(updateAppSettings(
        'display',
        { [event.target.name]: event.target.checked }
      ))
    },

    onHomePositionChanged (value) {
      console.log('changed to', value)
      dispatch(setHomePosition(value))
    }
  })
)(DisplayTabPresentation)

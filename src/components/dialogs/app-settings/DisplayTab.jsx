import PropTypes from 'prop-types'
import React from 'react'
import { connect } from 'react-redux'

import Checkbox from '@material-ui/core/Checkbox'
import FormControlLabel from '@material-ui/core/FormControlLabel'
import FormGroup from '@material-ui/core/FormGroup'
import Typography from '@material-ui/core/Typography'

import { updateAppSettings } from '../../../actions/app-settings'
import {
  clearHomePosition,
  setFlatEarthCoordinateSystemOrientation,
  setHomePosition
} from '../../../actions/map-origin'
import CoordinateField from '../../CoordinateField'
import RotationField from '../../RotationField'

const DisplayTabPresentation = props => (
  <FormGroup>
    <Typography variant='body2' style={{ marginTop: '1em' }}>Map widgets</Typography>
    <FormControlLabel label='Show mouse coordinates'
      control={<Checkbox checked={props.showMouseCoordinates}
        name='showMouseCoordinates'
        onChange={props.onCheckboxToggled} />} />
    <FormControlLabel label='Show scale line'
      control={<Checkbox checked={props.showScaleLine}
        name='showScaleLine'
        onChange={props.onCheckboxToggled} />} />

    <Typography variant='body2' style={{ marginBottom: '0.5em' }}>
      Flat Earth coordinate system
    </Typography>
    <CoordinateField label='Origin'
      value={props.homePosition}
      onChange={props.onHomePositionChanged}
    />
    <RotationField label='Orientation'
      value={props.orientation}
      onChange={props.onOrientationChanged}
    />
  </FormGroup>
)

DisplayTabPresentation.propTypes = {
  homePosition: PropTypes.arrayOf(PropTypes.number),
  onCheckboxToggled: PropTypes.func,
  onHomePositionChanged: PropTypes.func,
  onOrientationChanged: PropTypes.func,
  orientation: PropTypes.number,
  showMouseCoordinates: PropTypes.bool,
  showScaleLine: PropTypes.bool
}

export default connect(
  // mapStateToProps
  state => ({
    homePosition: state.map.origin.position,
    orientation: state.map.origin.angle,
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
      dispatch(value ? setHomePosition(value) : clearHomePosition())
    },

    onOrientationChanged (value) {
      dispatch(setFlatEarthCoordinateSystemOrientation(value || 0))
    }
  })
)(DisplayTabPresentation)

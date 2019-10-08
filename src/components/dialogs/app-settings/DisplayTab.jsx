import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import Checkbox from '@material-ui/core/Checkbox';
import FormControl from '@material-ui/core/FormControl';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormGroup from '@material-ui/core/FormGroup';
import Input from '@material-ui/core/Input';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import Select from '@material-ui/core/Select';
import Typography from '@material-ui/core/Typography';

import { updateAppSettings } from '~/actions/app-settings';
import {
  clearHomePosition,
  setFlatEarthCoordinateSystemOrientation,
  setFlatEarthCoordinateSystemType,
  setHomePosition
} from '~/actions/map-origin';
import CoordinateField from '~/components/CoordinateField';
import RotationField from '~/components/RotationField';
import { getMapOriginRotationAngle } from '~/selectors/map';

const DisplayTabPresentation = props => (
  <FormGroup>
    <Typography variant="body1" style={{ marginTop: '1em' }}>
      Map widgets
    </Typography>
    <FormControlLabel
      label="Show mouse coordinates"
      control={
        <Checkbox
          checked={props.showMouseCoordinates}
          name="showMouseCoordinates"
          onChange={props.onCheckboxToggled}
        />
      }
    />
    <FormControlLabel
      label="Show scale line"
      control={
        <Checkbox
          checked={props.showScaleLine}
          name="showScaleLine"
          onChange={props.onCheckboxToggled}
        />
      }
    />

    <Typography variant="body1" style={{ marginBottom: '0.5em' }}>
      Flat Earth coordinate system
    </Typography>
    <CoordinateField
      label="Origin"
      value={props.homePosition}
      onChange={props.onHomePositionChanged}
    />
    <FormControl>
      <InputLabel htmlFor="flat-earth-coordinate-system-type">Type</InputLabel>
      <Select
        value={props.coordinateSystemType}
        input={<Input id="flat-earth-coordinate-system-type" />}
        onChange={props.onCoordinateSystemTypeChanged}
      >
        <MenuItem value="neu">NEU (left-handed)</MenuItem>
        <MenuItem value="nwu">NWU (right-handed)</MenuItem>
      </Select>
    </FormControl>
    <RotationField
      label="Orientation (X+ axis)"
      value={props.orientation}
      onChange={props.onOrientationChanged}
    />
  </FormGroup>
);

DisplayTabPresentation.propTypes = {
  coordinateSystemType: PropTypes.oneOf(['neu', 'nwu']),
  homePosition: PropTypes.arrayOf(PropTypes.number),
  onCheckboxToggled: PropTypes.func,
  onCoordinateSystemTypeChanged: PropTypes.func,
  onHomePositionChanged: PropTypes.func,
  onOrientationChanged: PropTypes.func,
  orientation: PropTypes.number,
  showMouseCoordinates: PropTypes.bool,
  showScaleLine: PropTypes.bool
};

export default connect(
  // MapStateToProps
  state => ({
    coordinateSystemType: state.map.origin.type,
    homePosition: state.map.origin.position,
    orientation: getMapOriginRotationAngle(state),
    ...state.settings.display
  }),
  // MapDispatchToProps
  dispatch => ({
    onCheckboxToggled(event) {
      dispatch(
        updateAppSettings('display', {
          [event.target.name]: event.target.checked
        })
      );
    },

    onCoordinateSystemTypeChanged(event) {
      dispatch(setFlatEarthCoordinateSystemType(event.target.value));
    },

    onHomePositionChanged(value) {
      dispatch(value ? setHomePosition(value) : clearHomePosition());
    },

    onOrientationChanged(value) {
      dispatch(setFlatEarthCoordinateSystemOrientation(value || 0));
    }
  })
)(DisplayTabPresentation);

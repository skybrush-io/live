import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import Box from '@material-ui/core/Box';
import Checkbox from '@material-ui/core/Checkbox';
import FormControl from '@material-ui/core/FormControl';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormGroup from '@material-ui/core/FormGroup';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import Select from '@material-ui/core/Select';

import {
  clearOrigin,
  setFlatEarthCoordinateSystemOrientation,
  setFlatEarthCoordinateSystemType,
  setFlatEarthCoordinateSystemOrigin
} from '~/actions/map-origin';
import CoordinateSystemFields from '~/components/CoordinateSystemFields';
import Header from '~/components/dialogs/FormHeader';
import { updateAppSettings } from '~/features/settings/slice';
import { getMapOriginRotationAngle } from '~/selectors/map';

const DisplayTabPresentation = (props) => (
  <Box my={2}>
    <FormControl fullWidth variant="filled">
      <InputLabel id="display-theme-label">Theme</InputLabel>
      <Select
        labelId="display-theme-label"
        name="theme"
        value={props.theme}
        onChange={props.onFieldChanged}
      >
        <MenuItem value="auto">
          Choose automatically based on OS settings
        </MenuItem>
        <MenuItem value="light">Light mode</MenuItem>
        <MenuItem value="dark">Dark mode</MenuItem>
      </Select>
    </FormControl>

    <FormGroup>
      <Header>Map widgets</Header>
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
    </FormGroup>

    <FormGroup>
      <Header>Flat Earth coordinate system</Header>
      <CoordinateSystemFields
        origin={props.origin}
        orientation={props.orientation}
        type={props.coordinateSystemType}
        onOrientationChanged={props.onOrientationChanged}
        onOriginChanged={props.onOriginChanged}
        onTypeChanged={props.onCoordinateSystemTypeChanged}
      />
    </FormGroup>
  </Box>
);

DisplayTabPresentation.propTypes = {
  coordinateSystemType: PropTypes.oneOf(['neu', 'nwu']),
  origin: PropTypes.arrayOf(PropTypes.number),
  onCheckboxToggled: PropTypes.func,
  onCoordinateSystemTypeChanged: PropTypes.func,
  onFieldChanged: PropTypes.func,
  onOriginChanged: PropTypes.func,
  onOrientationChanged: PropTypes.func,
  orientation: PropTypes.number,
  showMouseCoordinates: PropTypes.bool,
  showScaleLine: PropTypes.bool,
  theme: PropTypes.oneOf(['auto', 'dark', 'light'])
};

export default connect(
  // mapStateToProps
  (state) => ({
    coordinateSystemType: state.map.origin.type,
    origin: state.map.origin.position,
    orientation: getMapOriginRotationAngle(state),
    ...state.settings.display
  }),
  // mapDispatchToProps
  (dispatch) => ({
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

    onFieldChanged(event) {
      dispatch(
        updateAppSettings('display', {
          [event.target.name]: event.target.value
        })
      );
    },

    onOriginChanged(value) {
      dispatch(
        value ? setFlatEarthCoordinateSystemOrigin(value) : clearOrigin()
      );
    },

    onOrientationChanged(value) {
      dispatch(setFlatEarthCoordinateSystemOrientation(value || 0));
    }
  })
)(DisplayTabPresentation);

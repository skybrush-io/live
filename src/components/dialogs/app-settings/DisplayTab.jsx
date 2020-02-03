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
import Typography from '@material-ui/core/Typography';

import {
  clearHomePosition,
  setFlatEarthCoordinateSystemOrientation,
  setFlatEarthCoordinateSystemType,
  setHomePosition
} from '~/actions/map-origin';
import CoordinateField from '~/components/CoordinateField';
import RotationField from '~/components/RotationField';
import { updateAppSettings } from '~/features/settings/slice';
import { getMapOriginRotationAngle } from '~/selectors/map';

const Header = ({ children, disablePadding, ...rest }) => (
  <Box color="text.secondary" mt={disablePadding ? 0 : 2} mb={0.5} {...rest}>
    <Typography variant="button" component="span">
      {children}
    </Typography>
  </Box>
);

Header.propTypes = {
  children: PropTypes.node,
  disablePadding: PropTypes.bool
};

const DisplayTabPresentation = props => (
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
      <CoordinateField
        label="Origin"
        value={props.homePosition}
        onChange={props.onHomePositionChanged}
      />
      <Box display="flex" flexDirection="row">
        <FormControl fullWidth>
          <InputLabel htmlFor="flat-earth-coordinate-system-type">
            Type
          </InputLabel>
          <Select
            value={props.coordinateSystemType}
            inputProps={{ id: 'flat-earth-coordinate-system-type' }}
            onChange={props.onCoordinateSystemTypeChanged}
          >
            <MenuItem value="neu">NEU (left-handed)</MenuItem>
            <MenuItem value="nwu">NWU (right-handed)</MenuItem>
          </Select>
        </FormControl>
        <Box p={1} />
        <RotationField
          fullWidth
          label="Orientation (X+ axis)"
          value={props.orientation}
          onChange={props.onOrientationChanged}
        />
      </Box>
    </FormGroup>
  </Box>
);

DisplayTabPresentation.propTypes = {
  coordinateSystemType: PropTypes.oneOf(['neu', 'nwu']),
  homePosition: PropTypes.arrayOf(PropTypes.number),
  onCheckboxToggled: PropTypes.func,
  onCoordinateSystemTypeChanged: PropTypes.func,
  onFieldChanged: PropTypes.func,
  onHomePositionChanged: PropTypes.func,
  onOrientationChanged: PropTypes.func,
  orientation: PropTypes.number,
  showMouseCoordinates: PropTypes.bool,
  showScaleLine: PropTypes.bool,
  theme: PropTypes.oneOf(['auto', 'dark', 'light'])
};

export default connect(
  // mapStateToProps
  state => ({
    coordinateSystemType: state.map.origin.type,
    homePosition: state.map.origin.position,
    orientation: getMapOriginRotationAngle(state),
    ...state.settings.display
  }),
  // mapDispatchToProps
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

    onFieldChanged(event) {
      dispatch(
        updateAppSettings('display', {
          [event.target.name]: event.target.value
        })
      );
    },

    onHomePositionChanged(value) {
      dispatch(value ? setHomePosition(value) : clearHomePosition());
    },

    onOrientationChanged(value) {
      dispatch(setFlatEarthCoordinateSystemOrientation(value || 0));
    }
  })
)(DisplayTabPresentation);

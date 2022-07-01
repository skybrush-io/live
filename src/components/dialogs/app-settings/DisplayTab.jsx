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

import CoordinateSystemFields from '~/components/CoordinateSystemFields';
import {
  setFlatEarthCoordinateSystemOrientation,
  setFlatEarthCoordinateSystemType,
  setFlatEarthCoordinateSystemOrigin,
} from '~/features/map/origin';
import { updateAppSettings } from '~/features/settings/slice';
import { CoordinateFormat, describeCoordinateFormat } from '~/model/settings';
import { getMapOriginRotationAngle } from '~/selectors/map';

import Header from '@skybrush/mui-components/lib/FormHeader';
import ThemeSelector from '@skybrush/mui-components/lib/ThemeSelector';

const coordinateFormatOrder = [
  CoordinateFormat.DEGREES,
  CoordinateFormat.DEGREES_MINUTES,
  CoordinateFormat.DEGREES_MINUTES_SECONDS,
  CoordinateFormat.SIGNED_DEGREES,
  CoordinateFormat.SIGNED_DEGREES_MINUTES,
  CoordinateFormat.SIGNED_DEGREES_MINUTES_SECONDS,
];

const DisplayTabPresentation = (props) => (
  <>
    <Box my={2}>
      <ThemeSelector value={props.theme} onChange={props.onFieldChanged} />
    </Box>

    <Box my={2}>
      <FormControl fullWidth variant='filled'>
        <InputLabel id='coordinate-format-label'>Coordinate format</InputLabel>
        <Select
          labelId='coordinate-format-label'
          name='coordinateFormat'
          value={props.coordinateFormat}
          onChange={props.onFieldChanged}
        >
          {coordinateFormatOrder.map((coordinateFormat) => (
            <MenuItem key={coordinateFormat} value={coordinateFormat}>
              {describeCoordinateFormat(coordinateFormat)}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormGroup>
        <Header>Map widgets</Header>
        <FormControlLabel
          label='Show mouse coordinates'
          control={
            <Checkbox
              checked={props.showMouseCoordinates}
              name='showMouseCoordinates'
              onChange={props.onCheckboxToggled}
            />
          }
        />
        <FormControlLabel
          label='Show scale line'
          control={
            <Checkbox
              checked={props.showScaleLine}
              name='showScaleLine'
              onChange={props.onCheckboxToggled}
            />
          }
        />
      </FormGroup>

      <FormGroup>
        <Header>Flat Earth coordinate system</Header>
        <CoordinateSystemFields
          origin={props.origin}
          originLabel='Map origin'
          orientation={props.orientation}
          type={props.coordinateSystemType}
          onOrientationChanged={props.onOrientationChanged}
          onOriginChanged={props.onOriginChanged}
          onTypeChanged={props.onCoordinateSystemTypeChanged}
        />
      </FormGroup>

      <FormGroup>
        <Header>Miscellaneous</Header>
        <FormControlLabel
          label='Enable experimental features (advanced)'
          control={
            <Checkbox
              checked={props.experimentalFeaturesEnabled}
              name='experimentalFeaturesEnabled'
              onChange={props.onCheckboxToggled}
            />
          }
        />
      </FormGroup>
    </Box>
  </>
);

DisplayTabPresentation.propTypes = {
  coordinateFormat: PropTypes.oneOf(coordinateFormatOrder),
  coordinateSystemType: PropTypes.oneOf(['neu', 'nwu']),
  experimentalFeaturesEnabled: PropTypes.bool,
  origin: PropTypes.arrayOf(PropTypes.number),
  onCheckboxToggled: PropTypes.func,
  onCoordinateSystemTypeChanged: PropTypes.func,
  onFieldChanged: PropTypes.func,
  onOriginChanged: PropTypes.func,
  onOrientationChanged: PropTypes.func,
  orientation: PropTypes.number,
  showMouseCoordinates: PropTypes.bool,
  showScaleLine: PropTypes.bool,
  theme: PropTypes.oneOf(['auto', 'dark', 'light']),
};

export default connect(
  // mapStateToProps
  (state) => ({
    coordinateSystemType: state.map.origin.type,
    origin: state.map.origin.position,
    orientation: getMapOriginRotationAngle(state),
    ...state.settings.display,
  }),
  // mapDispatchToProps
  (dispatch) => ({
    onCheckboxToggled(event) {
      dispatch(
        updateAppSettings('display', {
          [event.target.name]: event.target.checked,
        })
      );
    },

    onCoordinateSystemTypeChanged(event) {
      dispatch(setFlatEarthCoordinateSystemType(event.target.value));
    },

    onFieldChanged(event) {
      dispatch(
        updateAppSettings('display', {
          [event.target.name]: event.target.value,
        })
      );
    },

    onOriginChanged(value) {
      dispatch(setFlatEarthCoordinateSystemOrigin(value));
    },

    onOrientationChanged(value) {
      dispatch(setFlatEarthCoordinateSystemOrientation(value || 0));
    },
  })
)(DisplayTabPresentation);

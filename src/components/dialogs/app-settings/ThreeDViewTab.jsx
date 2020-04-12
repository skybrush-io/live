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

import Header from '~/components/dialogs/FormHeader';
import { updateAppSettings } from '~/features/settings/slice';

const sceneries = [
  {
    id: 'day',
    label: 'Day'
  },
  {
    id: 'night',
    label: 'Night'
  },
  {
    id: 'indoor',
    label: 'Indoor'
  }
];

const grids = [
  {
    id: 'none',
    label: 'No grid'
  },
  {
    id: '1x1',
    label: '10x10 meters'
  },
  {
    id: '2x2',
    label: '20x20 meters'
  }
];

const ThreeDViewTab = (props) => (
  <Box mb={2}>
    <FormGroup>
      <Header>Environment</Header>
      <Box display="flex">
        <FormControl fullWidth variant="filled">
          <InputLabel id="threed-scenery-label">Scenery</InputLabel>
          <Select
            labelId="threed-scenery-label"
            name="scenery"
            value={props.scenery}
            onChange={props.onFieldChanged}
          >
            {sceneries.map((item) => (
              <MenuItem key={item.id} value={item.id}>
                {item.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Box px={1} />
        <FormControl fullWidth variant="filled">
          <InputLabel id="threed-grid-label">Grid</InputLabel>
          <Select
            labelId="threed-grid-label"
            name="grid"
            value={props.grid}
            onChange={props.onFieldChanged}
          >
            {grids.map((item) => (
              <MenuItem key={item.id} value={item.id}>
                {item.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <FormControlLabel
        label="Show coordinate system axes"
        control={
          <Checkbox
            checked={props.showAxes}
            name="showAxes"
            onChange={props.onCheckboxToggled}
          />
        }
      />

      <FormControlLabel
        label="Show home positions"
        control={
          <Checkbox
            checked={props.showHomePositions}
            name="showHomePositions"
            onChange={props.onCheckboxToggled}
          />
        }
      />

      <FormControlLabel
        label="Show landing positions"
        control={
          <Checkbox
            checked={props.showLandingPositions}
            name="showLandingPositions"
            onChange={props.onCheckboxToggled}
          />
        }
      />
    </FormGroup>

    <FormGroup>
      <Header>Rendering</Header>
      <FormControlLabel
        label="Show rendering statistics (advanced)"
        control={
          <Checkbox
            checked={props.showStatistics}
            name="showStatistics"
            onChange={props.onCheckboxToggled}
          />
        }
      />
    </FormGroup>
  </Box>
);

ThreeDViewTab.propTypes = {
  grid: PropTypes.string,
  onCheckboxToggled: PropTypes.func,
  onFieldChanged: PropTypes.func,
  scenery: PropTypes.string,
  showAxes: PropTypes.bool,
  showHomePositions: PropTypes.bool,
  showLandingPositions: PropTypes.bool,
  showStatistics: PropTypes.bool
};

export default connect(
  // mapStateToProps
  (state) => ({
    ...state.settings.threeD
  }),
  // mapDispatchToProps
  (dispatch) => ({
    onCheckboxToggled(event) {
      dispatch(
        updateAppSettings('threeD', {
          [event.target.name]: event.target.checked
        })
      );
    },

    onFieldChanged(event) {
      dispatch(
        updateAppSettings('threeD', {
          [event.target.name]: event.target.value
        })
      );
    }
  })
)(ThreeDViewTab);

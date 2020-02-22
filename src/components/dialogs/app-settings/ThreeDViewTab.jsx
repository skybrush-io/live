import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import Box from '@material-ui/core/Box';
import FormControl from '@material-ui/core/FormControl';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import Select from '@material-ui/core/Select';

import { updateAppSettings } from '~/features/settings/slice';
import Scenery from '~/views/three-d/Scenery';

const sceneries = [
  {
    id: 'day',
    label: 'Day'
  },
  {
    id: 'night',
    label: 'Night'
  }
];

const grids = [
  {
    id: 'none',
    label: 'No grid'
  },
  {
    id: '1x1',
    label: '1x1 meters'
  },
  {
    id: '2x2',
    label: '2x2 meters'
  }
];

const ThreeDViewTab = props => (
  <Box my={2}>
    <Box display="flex">
      <FormControl fullWidth variant="filled">
        <InputLabel id="threed-scenery-label">Scenery</InputLabel>
        <Select
          labelId="threed-scenery-label"
          name="scenery"
          value={props.scenery}
          onChange={props.onFieldChanged}
        >
          {sceneries.map(item => (
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
          {grids.map(item => (
            <MenuItem key={item.id} value={item.id}>
              {item.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  </Box>
);

ThreeDViewTab.propTypes = {
  grid: PropTypes.string,
  onFieldChanged: PropTypes.func,
  scenery: PropTypes.string
};

export default connect(
  // mapStateToProps
  state => ({
    ...state.settings.threeD
  }),
  // mapDispatchToProps
  dispatch => ({
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

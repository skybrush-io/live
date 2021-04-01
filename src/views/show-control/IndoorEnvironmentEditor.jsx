import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import Box from '@material-ui/core/Box';
import Checkbox from '@material-ui/core/Checkbox';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormGroup from '@material-ui/core/FormGroup';

import FormHeader from '@skybrush/mui-components/lib/FormHeader';

import XYZFields from '~/components/XYZFields';
import {
  setFirstCornerOfRoom,
  setSecondCornerOfRoom,
} from '~/features/show/actions';
import { getRoomCorners, isRoomVisible } from '~/features/show/selectors';
import { setRoomVisibility } from '~/features/show/slice';

/**
 * Presentation component for the form that allows the user to edit the
 * environment of an outdoor drone show.
 */
const IndoorEnvironmentEditor = ({
  roomVisible,
  firstCorner,
  secondCorner,
  onRoomVisibilityChanged,
  onFirstCornerChanged,
  onSecondCornerChanged,
}) => (
  <FormGroup>
    <FormHeader>Coordinates of the corners of the room</FormHeader>
    <XYZFields value={firstCorner} onChange={onFirstCornerChanged} />
    <Box p={1} />
    <XYZFields value={secondCorner} onChange={onSecondCornerChanged} />
    <Box p={1} />
    <FormControlLabel
      label='Room visible in 3D view'
      control={
        <Checkbox
          checked={Boolean(roomVisible)}
          onChange={onRoomVisibilityChanged}
        />
      }
    />
  </FormGroup>
);

IndoorEnvironmentEditor.propTypes = {
  roomVisible: PropTypes.bool,
  firstCorner: PropTypes.arrayOf(PropTypes.number),
  secondCorner: PropTypes.arrayOf(PropTypes.number),
  onFirstCornerChanged: PropTypes.func,
  onSecondCornerChanged: PropTypes.func,
  onRoomVisibilityChanged: PropTypes.func,
};

export default connect(
  // mapStateToProps
  (state) => {
    const corners = getRoomCorners(state);
    return {
      firstCorner: corners[0],
      secondCorner: corners[1],
      roomVisible: isRoomVisible(state),
    };
  },

  // mapDispatchToProps
  {
    onRoomVisibilityChanged: (event) => setRoomVisibility(event.target.checked),
    onFirstCornerChanged: setFirstCornerOfRoom,
    onSecondCornerChanged: setSecondCornerOfRoom,
  }
)(IndoorEnvironmentEditor);

import Box from '@mui/material/Box';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormGroup from '@mui/material/FormGroup';
import PropTypes from 'prop-types';
import React from 'react';
import { withTranslation } from 'react-i18next';
import { connect } from 'react-redux';

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
  t,
}) => (
  <FormGroup>
    <FormHeader>
      {t('indoorEnvironmentEditor.coordinatesOfTheCorners')}
    </FormHeader>
    <XYZFields value={firstCorner} onChange={onFirstCornerChanged} />
    <Box sx={{ p: 1 }} />
    <XYZFields value={secondCorner} onChange={onSecondCornerChanged} />
    <Box sx={{ p: 1 }} />
    <FormControlLabel
      label={t('indoorEnvironmentEditor.roomVisibleIn3D')}
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
  t: PropTypes.func,
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
)(withTranslation()(IndoorEnvironmentEditor));

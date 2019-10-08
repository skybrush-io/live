import PropTypes from 'prop-types';
import React from 'react';

import IconButton from '@material-ui/core/IconButton';
import withTheme from '@material-ui/core/styles/withTheme';
import LocationOn from '@material-ui/icons/LocationOn';
import ShowChart from '@material-ui/icons/ShowChart';
import CropSquare from '@material-ui/icons/CropSquare';
import PanoramaFishEye from '@material-ui/icons/PanoramaFishEye';
import StarBorder from '@material-ui/icons/StarBorder';

import partial from 'lodash/partial';
import { connect } from 'react-redux';

import { selectMapTool } from '../../actions/map';
import EditFeature from '../../icons/EditFeature';
import { Tool } from './tools';

/**
 * Presentation component for the drawing toolbar.
 *
 * @return {React.Element} the rendered component
 */
const DrawingToolbarPresentation = ({
  onToolSelected,
  selectedTool,
  theme
}) => {
  const colorForTool = tool => (selectedTool === tool ? 'primary' : undefined);

  return (
    <div style={{ display: 'flex', flexFlow: 'column nowrap' }}>
      <IconButton
        tooltip="Add marker"
        onClick={partial(onToolSelected, Tool.DRAW_POINT)}
      >
        <LocationOn color={colorForTool(Tool.DRAW_POINT)} />
      </IconButton>
      <IconButton
        tooltip="Draw path"
        onClick={partial(onToolSelected, Tool.DRAW_PATH)}
      >
        <ShowChart color={colorForTool(Tool.DRAW_PATH)} />
      </IconButton>
      <IconButton
        tooltip="Draw circle"
        onClick={partial(onToolSelected, Tool.DRAW_CIRCLE)}
      >
        <PanoramaFishEye color={colorForTool(Tool.DRAW_CIRCLE)} />
      </IconButton>
      <IconButton
        tooltip="Draw rectangle"
        onClick={partial(onToolSelected, Tool.DRAW_RECTANGLE)}
      >
        <CropSquare color={colorForTool(Tool.DRAW_RECTANGLE)} />
      </IconButton>
      <IconButton
        tooltip="Draw polygon"
        onClick={partial(onToolSelected, Tool.DRAW_POLYGON)}
      >
        <StarBorder color={colorForTool(Tool.DRAW_POLYGON)} />
      </IconButton>
      <IconButton
        tooltip="Edit feature"
        onClick={partial(onToolSelected, Tool.EDIT_FEATURE)}
      >
        <EditFeature color={colorForTool(Tool.EDIT_FEATURE)} />
      </IconButton>
    </div>
  );
};

DrawingToolbarPresentation.propTypes = {
  onToolSelected: PropTypes.func,
  selectedTool: PropTypes.string,
  theme: PropTypes.object.isRequired
};

/**
 * Drawing toolbar on the map.
 */
const DrawingToolbar = connect(
  // MapStateToProps
  state => ({ ...state.map.tools }),
  // MapDispatchToProps
  dispatch => ({
    onToolSelected(tool) {
      dispatch(selectMapTool(tool));
    }
  })
)(withTheme(DrawingToolbarPresentation));

export default DrawingToolbar;

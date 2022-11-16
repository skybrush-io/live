import PropTypes from 'prop-types';
import React from 'react';

import Divider from '@material-ui/core/Divider';
import IconButton from '@material-ui/core/IconButton';
import SelectAll from '@material-ui/icons/SelectAll';
import LocationOn from '@material-ui/icons/LocationOn';
import ShowChart from '@material-ui/icons/ShowChart';
import CropSquare from '@material-ui/icons/CropSquare';
import PanoramaFishEye from '@material-ui/icons/PanoramaFishEye';
import StarBorder from '@material-ui/icons/StarBorder';
import ZoomIn from '@material-ui/icons/ZoomIn';

import partial from 'lodash-es/partial';
import { connect } from 'react-redux';

import { TooltipWithContainerFromContext as Tooltip } from '~/containerContext';
import ContentCut from '~/icons/ContentCut';
import EditFeature from '~/icons/EditFeature';
import { setSelectedTool } from '~/features/map/tools';

import { Tool } from './tools';

/**
 * Presentation component for the drawing toolbar.
 *
 * @return {React.Element} the rendered component
 */
const DrawingToolbarPresentation = ({ onToolSelected, selectedTool }) => {
  const colorForTool = (tool) =>
    selectedTool === tool ? 'primary' : undefined;

  return (
    <div style={{ display: 'flex', flexFlow: 'column nowrap' }}>
      <Tooltip content='Select' placement='right'>
        <IconButton onClick={partial(onToolSelected, Tool.SELECT)}>
          <SelectAll color={colorForTool(Tool.SELECT)} />
        </IconButton>
      </Tooltip>

      <Tooltip content='Zoom' placement='right'>
        <IconButton onClick={partial(onToolSelected, Tool.ZOOM)}>
          <ZoomIn color={colorForTool(Tool.ZOOM)} />
        </IconButton>
      </Tooltip>

      <Divider />

      <Tooltip content='Add marker' placement='right'>
        <IconButton onClick={partial(onToolSelected, Tool.DRAW_POINT)}>
          <LocationOn color={colorForTool(Tool.DRAW_POINT)} />
        </IconButton>
      </Tooltip>

      <Tooltip content='Draw path' placement='right'>
        <IconButton onClick={partial(onToolSelected, Tool.DRAW_PATH)}>
          <ShowChart color={colorForTool(Tool.DRAW_PATH)} />
        </IconButton>
      </Tooltip>

      <Tooltip content='Draw circle' placement='right'>
        <IconButton onClick={partial(onToolSelected, Tool.DRAW_CIRCLE)}>
          <PanoramaFishEye color={colorForTool(Tool.DRAW_CIRCLE)} />
        </IconButton>
      </Tooltip>

      <Tooltip content='Draw rectangle' placement='right'>
        <IconButton onClick={partial(onToolSelected, Tool.DRAW_RECTANGLE)}>
          <CropSquare color={colorForTool(Tool.DRAW_RECTANGLE)} />
        </IconButton>
      </Tooltip>

      <Tooltip content='Draw polygon' placement='right'>
        <IconButton onClick={partial(onToolSelected, Tool.DRAW_POLYGON)}>
          <StarBorder color={colorForTool(Tool.DRAW_POLYGON)} />
        </IconButton>
      </Tooltip>

      <Tooltip content='Cut hole into polygon' placement='right'>
        <IconButton onClick={partial(onToolSelected, Tool.CUT_HOLE)}>
          <ContentCut color={colorForTool(Tool.CUT_HOLE)} />
        </IconButton>
      </Tooltip>

      <Tooltip content='Edit feature' placement='right'>
        <IconButton onClick={partial(onToolSelected, Tool.EDIT_FEATURE)}>
          <EditFeature color={colorForTool(Tool.EDIT_FEATURE)} />
        </IconButton>
      </Tooltip>
    </div>
  );
};

DrawingToolbarPresentation.propTypes = {
  onToolSelected: PropTypes.func,
  selectedTool: PropTypes.string,
};

/**
 * Drawing toolbar on the map.
 */
const DrawingToolbar = connect(
  // mapStateToProps
  (state) => ({ ...state.map.tools }),
  // mapDispatchToProps
  {
    onToolSelected: setSelectedTool,
  }
)(DrawingToolbarPresentation);

export default DrawingToolbar;

import config from 'config';

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
import { getSelectedTool, setSelectedTool } from '~/features/map/tools';

import { Tool } from './tools';

const drawingToolRegistry = {
  'add-marker': {
    tool: Tool.DRAW_POINT,
    label: 'Add marker',
    icon: LocationOn,
  },
  'cut-hole': {
    tool: Tool.CUT_HOLE,
    label: 'Cut hole into polygon',
    icon: ContentCut,
  },
  'draw-circle': {
    tool: Tool.DRAW_CIRCLE,
    label: 'Draw circle',
    icon: PanoramaFishEye,
  },
  'draw-path': {
    tool: Tool.DRAW_PATH,
    label: 'Draw path',
    icon: ShowChart,
  },
  'draw-polygon': {
    tool: Tool.DRAW_POLYGON,
    label: 'Draw polygon',
    icon: StarBorder,
  },
  'draw-rectangle': {
    tool: Tool.DRAW_RECTANGLE,
    label: 'Draw rectangle',
    icon: CropSquare,
  },
  'edit-feature': {
    tool: Tool.EDIT_FEATURE,
    label: 'Edit feature',
    icon: EditFeature,
  },
  select: {
    tool: Tool.SELECT,
    label: 'Select',
    icon: SelectAll,
  },
  zoom: {
    tool: Tool.ZOOM,
    label: 'Zoom',
    icon: ZoomIn,
  },
};

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
      {config.mapDrawingToolbarTools
        .flatMap((group) => [
          <Divider key={`drawing-toolbar-group:${group.join(',')}`} />,
          ...group.map((t) => {
            const { tool, label, icon: Icon } = drawingToolRegistry[t];
            return (
              <Tooltip key={t} content={label} placement='right'>
                <IconButton onClick={partial(onToolSelected, tool)}>
                  <Icon color={colorForTool(tool)} />
                </IconButton>
              </Tooltip>
            );
          }),
        ])
        .slice(1)}
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
  (state) => ({
    selectedTool: getSelectedTool(state),
  }),
  // mapDispatchToProps
  {
    onToolSelected: setSelectedTool,
  }
)(DrawingToolbarPresentation);

export default DrawingToolbar;

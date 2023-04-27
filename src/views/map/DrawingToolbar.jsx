import config from 'config';

import PropTypes from 'prop-types';
import React from 'react';
import { withTranslation } from 'react-i18next';
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
    label: 'DrawingToolbar.addMarker',
    icon: LocationOn,
  },
  'cut-hole': {
    tool: Tool.CUT_HOLE,
    label: 'DrawingToolbar.cutHole',
    icon: ContentCut,
  },
  'draw-circle': {
    tool: Tool.DRAW_CIRCLE,
    label: 'DrawingToolbar.drawCircle',
    icon: PanoramaFishEye,
  },
  'draw-path': {
    tool: Tool.DRAW_PATH,
    label: 'DrawingToolbar.drawPath',
    icon: ShowChart,
  },
  'draw-polygon': {
    tool: Tool.DRAW_POLYGON,
    label: 'DrawingToolbar.drawPolygon',
    icon: StarBorder,
  },
  'draw-rectangle': {
    tool: Tool.DRAW_RECTANGLE,
    label: 'DrawingToolbar.drawRectangle',
    icon: CropSquare,
  },
  'edit-feature': {
    tool: Tool.EDIT_FEATURE,
    label: 'DrawingToolbar.editFeature',
    icon: EditFeature,
  },
  select: {
    tool: Tool.SELECT,
    label: 'DrawingToolbar.select',
    icon: SelectAll,
  },
  zoom: {
    tool: Tool.ZOOM,
    label: 'DrawingToolbar.zoom',
    icon: ZoomIn,
  },
};

/**
 * Presentation component for the drawing toolbar.
 *
 * @return {React.Element} the rendered component
 */
const DrawingToolbarPresentation = ({ onToolSelected, selectedTool, t }) => {
  const colorForTool = (tool) =>
    selectedTool === tool ? 'primary' : undefined;

  return (
    <div style={{ display: 'flex', flexFlow: 'column nowrap' }}>
      {config.mapDrawingToolbarTools
        .flatMap((group) => [
          <Divider key={`drawing-toolbar-group:${group.join(',')}`} />,
          ...group.map((toolId) => {
            const { tool, label, icon: Icon } = drawingToolRegistry[toolId];
            return (
              <Tooltip key={toolId} content={t(label)} placement='right'>
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
  t: PropTypes.func,
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
)(withTranslation()(DrawingToolbarPresentation));

export default DrawingToolbar;

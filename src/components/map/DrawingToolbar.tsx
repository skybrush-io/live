import type { TFunction } from 'i18next';
import partial from 'lodash-es/partial';
import React from 'react';
import { withTranslation } from 'react-i18next';

import type { SvgIconProps } from '@material-ui/core';
import Divider from '@material-ui/core/Divider';
import IconButton from '@material-ui/core/IconButton';
import CropSquare from '@material-ui/icons/CropSquare';
import FiberManualRecord from '@material-ui/icons/FiberManualRecord';
import PanoramaFishEye from '@material-ui/icons/PanoramaFishEye';
import Place from '@material-ui/icons/Place';
import SelectAll from '@material-ui/icons/SelectAll';
import ShowChart from '@material-ui/icons/ShowChart';
import StarBorder from '@material-ui/icons/StarBorder';
import ZoomIn from '@material-ui/icons/ZoomIn';

import { Tool } from '~/components/map/tools';
import { TooltipWithContainerFromContext as Tooltip } from '~/containerContext';
import { type PreparedI18nKey, tt } from '~/i18n';
import ContentCut from '~/icons/ContentCut';
import EditFeature from '~/icons/EditFeature';

type ToolConfig = {
  tool: Tool;
  label: PreparedI18nKey;
  icon: React.ComponentType<SvgIconProps>;
};

type DrawingToolId =
  | 'add-marker'
  | 'add-waypoint'
  | 'cut-hole'
  | 'draw-circle'
  | 'draw-path'
  | 'draw-polygon'
  | 'draw-rectangle'
  | 'edit-feature'
  | 'select'
  | 'zoom';

const drawingToolRegistry: Record<DrawingToolId, ToolConfig> = {
  'add-marker': {
    tool: Tool.DRAW_POINT,
    label: tt('DrawingToolbar.addMarker'),
    icon: FiberManualRecord,
  },
  'add-waypoint': {
    tool: Tool.ADD_WAYPOINT,
    label: tt('DrawingToolbar.addWaypoint'),
    icon: Place,
  },
  'cut-hole': {
    tool: Tool.CUT_HOLE,
    label: tt('DrawingToolbar.cutHole'),
    icon: ContentCut,
  },
  'draw-circle': {
    tool: Tool.DRAW_CIRCLE,
    label: tt('DrawingToolbar.drawCircle'),
    icon: PanoramaFishEye,
  },
  'draw-path': {
    tool: Tool.DRAW_PATH,
    label: tt('DrawingToolbar.drawPath'),
    icon: ShowChart,
  },
  'draw-polygon': {
    tool: Tool.DRAW_POLYGON,
    label: tt('DrawingToolbar.drawPolygon'),
    icon: StarBorder,
  },
  'draw-rectangle': {
    tool: Tool.DRAW_RECTANGLE,
    label: tt('DrawingToolbar.drawRectangle'),
    icon: CropSquare,
  },
  'edit-feature': {
    tool: Tool.EDIT_FEATURE,
    label: tt('DrawingToolbar.editFeature'),
    icon: EditFeature,
  },
  select: {
    tool: Tool.SELECT,
    label: tt('general.action.select'),
    icon: SelectAll,
  },
  zoom: {
    tool: Tool.ZOOM,
    label: tt('general.geometry.zoom'),
    icon: ZoomIn,
  },
};

type DrawingToolIdGroup = DrawingToolId[];

type DrawingToolbarProps = {
  onToolSelected: (tool: Tool) => void;
  selectedTool: Tool;
  t: TFunction;
  /**
   * Groups of drawing tool IDs.
   */
  drawingTools: DrawingToolIdGroup[];
};

const DrawingToolbar = ({
  drawingTools,
  onToolSelected,
  selectedTool,
  t,
}: DrawingToolbarProps) => {
  const colorForTool = (tool: Tool): SvgIconProps['color'] =>
    selectedTool === tool ? 'primary' : undefined;

  return (
    <div style={{ display: 'flex', flexFlow: 'column nowrap' }}>
      {drawingTools
        .flatMap((group) => [
          <Divider key={`drawing-toolbar-group:${group.join(',')}`} />,
          ...group.map((toolId) => {
            const { tool, label, icon: Icon } = drawingToolRegistry[toolId];
            return (
              <Tooltip key={toolId} content={label(t)} placement='right'>
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

/**
 * Drawing toolbar on the map.
 */
const TranslatedDrawingToolbar = withTranslation()(DrawingToolbar);

export default TranslatedDrawingToolbar;

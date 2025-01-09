import config from 'config';

import PropTypes from 'prop-types';
import React from 'react';
import { withTranslation } from 'react-i18next';

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

import partial from 'lodash-es/partial';
import { connect } from 'react-redux';

import { TooltipWithContainerFromContext as Tooltip } from '~/containerContext';
import { getSelectedTool, setSelectedTool } from '~/features/map/tools';
import i18n, { tt } from '~/i18n';
import ContentCut from '~/icons/ContentCut';
import EditFeature from '~/icons/EditFeature';

import { Tool } from './tools';

const drawingToolRegistry = {
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
      {config.map.drawingTools
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
    onToolSelected: (tool) => {
      const voices = window.speechSynthesis.getVoices();
      const en = voices.find((v) => v.lang === 'en-US');
      const hu = voices.find((v) => v.lang === 'hu-HU');

      window.speechSynthesis.speak(
        Object.assign(
          new SpeechSynthesisUtterance(
            i18n.t('DrawingToolbar.selectedAction', {
              tool: i18n.t(`DrawingToolbar.${tool}`),
            })
          ),
          { voice: { en, hu }[i18n.language] }
        )
      );

      return setSelectedTool(tool);
    },
  }
)(withTranslation()(DrawingToolbarPresentation));

export default DrawingToolbar;

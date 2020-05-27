import PropTypes from 'prop-types';
import React from 'react';

import IconButton from '@material-ui/core/IconButton';
import withTheme from '@material-ui/core/styles/withTheme';
import ActionPanTool from '@material-ui/icons/PanTool';
import ActionZoomIn from '@material-ui/icons/ZoomIn';
import ContentSelectAll from '@material-ui/icons/SelectAll';

import partial from 'lodash-es/partial';
import { connect } from 'react-redux';

import { selectMapTool } from '~/actions/map';
import { getMapViewRotationAngle } from '~/selectors/map';

import FitAllFeaturesButton from './FitAllFeaturesButton';
import MapRotationTextBox from './MapRotationTextBox';
import { Tool } from './tools';

/**
 * Separator component for the toolbar
 *
 * @returns {Object} the rendered component
 */
const MapToolbarSeparator = () => {
  return (
    <div
      style={{
        display: 'inline-block',
        height: '48px',
        borderLeft: '1px solid rgba(0, 0, 0,  0.172549)',
        verticalAlign: 'top',
      }}
    />
  );
};

/**
 * Presentation component for the map toolbar.
 *
 * @returns {React.Element} the rendered component
 */
const MapToolbarPresentation = ({
  initialRotation,
  onToolSelected,
  selectedTool,
}) => {
  const colorForTool = (tool) =>
    selectedTool === tool ? 'primary' : undefined;

  return (
    <div>
      {/*
      <IconButton
        tooltip='Select'
        onClick={partial(onToolSelected, Tool.SELECT)}
      >
        <ContentSelectAll color={colorForTool(Tool.SELECT)} />
      </IconButton>
      <IconButton tooltip='Pan' onClick={partial(onToolSelected, Tool.PAN)}>
        <ActionPanTool color={colorForTool(Tool.PAN)} />
      </IconButton>
      <IconButton tooltip='Zoom' onClick={partial(onToolSelected, Tool.ZOOM)}>
        <ActionZoomIn color={colorForTool(Tool.ZOOM)} />
      </IconButton>

      <MapToolbarSeparator />
      */}

      <MapRotationTextBox
        initialRotation={initialRotation}
        resetDuration={500}
        fieldWidth='75px'
        style={{
          display: 'inline-block',
          marginRight: '12px',
          verticalAlign: 'top',
        }}
      />

      <MapToolbarSeparator />

      <FitAllFeaturesButton duration={500} margin={64} />
    </div>
  );
};

MapToolbarPresentation.propTypes = {
  onToolSelected: PropTypes.func,
  selectedTool: PropTypes.string,
};

/**
 * Main toolbar on the map.
 */
const MapToolbar = connect(
  // mapStateToProps
  (state) => ({
    ...state.map.tools,
    initialRotation: getMapViewRotationAngle(state),
  }),
  // mapDispatchToProps
  (dispatch) => ({
    onToolSelected(tool) {
      dispatch(selectMapTool(tool));
    },
  })
)(withTheme(MapToolbarPresentation));

export default MapToolbar;

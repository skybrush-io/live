import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import Box from '@material-ui/core/Box';
import IconButton from '@material-ui/core/IconButton';
import Add from '@material-ui/icons/Add';
import Pause from '@material-ui/icons/Pause';
import Place from '@material-ui/icons/Place';
import PlayArrow from '@material-ui/icons/PlayArrow';
import Remove from '@material-ui/icons/Remove';
import Replay from '@material-ui/icons/Replay';

import DialogToolbar from '@skybrush/mui-components/lib/DialogToolbar';
import Tooltip from '@skybrush/mui-components/lib/Tooltip';

import ToolbarDivider from '~/components/ToolbarDivider';
import { UAVSelectorWrapper } from '~/components/uavs/UAVSelector';

import {
  copyAveragedCentroidOfSelectedUAVsToClipboard,
  pauseAveragingSelectedUAVs,
  resumeAveragingSelectedUAVs,
  restartAveragingSelectedUAVs,
  setAveragedCentroidOfSelectedUAVsAsMapOrigin,
  stopAveragingSelectedUAVs,
} from '~/features/measurement/actions';
import { startAveragingUAVCoordinateById } from '~/features/measurement/slice';
import {
  hasActiveOrPausedAveragingMeasurements,
  hasSelectionInAveragingMeasurementDialogBox,
} from '~/features/measurement/selectors';

import ContentCopy from '~/icons/ContentCopy';

/**
 * Presentation component for the dialog that allows the user to take a
 * long-running average of the coordinates of one or more UAVs.
 */
const CoordinateAveragingDialogToolbar = ({
  hasMeasurements,
  hasSelection,
  onCopyCentroidOfSelection,
  onPauseSelected,
  onRemoveSelected,
  onRestartSelected,
  onResumeSelected,
  onSetCentroidOfSelectionAsMapOrigin,
  onUAVIdAdded,
}) => {
  return (
    <DialogToolbar disableGutters>
      <Box position='absolute' display='flex'>
        <UAVSelectorWrapper filterable onSelect={onUAVIdAdded}>
          {(handleClick) => (
            <Tooltip content='Add new drone'>
              <IconButton color='inherit' onClick={handleClick}>
                <Add />
              </IconButton>
            </Tooltip>
          )}
        </UAVSelectorWrapper>
        <Tooltip content='Remove selected'>
          <IconButton
            disabled={!hasSelection}
            color='inherit'
            onClick={onRemoveSelected}
          >
            <Remove />
          </IconButton>
        </Tooltip>
        <ToolbarDivider orientation='vertical' />
        <Tooltip content='Pause measurement'>
          <IconButton
            disabled={!hasMeasurements}
            color='inherit'
            onClick={onPauseSelected}
          >
            <Pause />
          </IconButton>
        </Tooltip>
        <Tooltip content='Resume measurement'>
          <IconButton
            disabled={!hasMeasurements}
            color='inherit'
            onClick={onResumeSelected}
          >
            <PlayArrow />
          </IconButton>
        </Tooltip>
        <Tooltip content='Reset measurement'>
          <IconButton
            disabled={!hasMeasurements || !hasSelection}
            color='inherit'
            onClick={onRestartSelected}
          >
            <Replay />
          </IconButton>
        </Tooltip>
        <ToolbarDivider orientation='vertical' />
        <Tooltip content='Copy centroid'>
          <IconButton
            disabled={!hasMeasurements}
            color='inherit'
            onClick={onCopyCentroidOfSelection}
          >
            <ContentCopy />
          </IconButton>
        </Tooltip>
        <Tooltip content='Set centroid as map origin'>
          <IconButton
            disabled={!hasMeasurements}
            color='inherit'
            onClick={onSetCentroidOfSelectionAsMapOrigin}
          >
            <Place />
          </IconButton>
        </Tooltip>
      </Box>
    </DialogToolbar>
  );
};

CoordinateAveragingDialogToolbar.propTypes = {
  hasMeasurements: PropTypes.bool,
  hasSelection: PropTypes.bool,
  onCopyCentroidOfSelection: PropTypes.func,
  onPauseSelected: PropTypes.func,
  onRemoveSelected: PropTypes.func,
  onResumeSelected: PropTypes.func,
  onRestartSelected: PropTypes.func,
  onSetCentroidOfSelectionAsMapOrigin: PropTypes.func,
  onUAVIdAdded: PropTypes.func,
};

export default connect(
  // mapStateToProps
  (state) => ({
    hasMeasurements: hasActiveOrPausedAveragingMeasurements(state),
    hasSelection: hasSelectionInAveragingMeasurementDialogBox(state),
  }),

  // mapDispatchToProps
  {
    onCopyCentroidOfSelection: copyAveragedCentroidOfSelectedUAVsToClipboard,
    onPauseSelected: pauseAveragingSelectedUAVs,
    onRemoveSelected: stopAveragingSelectedUAVs,
    onResumeSelected: resumeAveragingSelectedUAVs,
    onRestartSelected: restartAveragingSelectedUAVs,
    onSetCentroidOfSelectionAsMapOrigin:
      setAveragedCentroidOfSelectedUAVsAsMapOrigin,
    onUAVIdAdded: startAveragingUAVCoordinateById,
  }
)(CoordinateAveragingDialogToolbar);

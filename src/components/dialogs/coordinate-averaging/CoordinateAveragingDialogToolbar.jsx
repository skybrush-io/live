import PropTypes from 'prop-types';
import React, { useCallback, useRef } from 'react';
import { connect } from 'react-redux';

import Box from '@material-ui/core/Box';
import IconButton from '@material-ui/core/IconButton';
import Add from '@material-ui/icons/Add';
import Check from '@material-ui/icons/Check';
import Clear from '@material-ui/icons/Clear';
import Pause from '@material-ui/icons/Pause';
import PlayArrow from '@material-ui/icons/PlayArrow';
import Remove from '@material-ui/icons/Remove';
import Replay from '@material-ui/icons/Replay';

import ActiveUAVsField from '~/components/ActiveUAVsField';
import ToolbarDivider from '~/components/ToolbarDivider';
import Tooltip from '~/components/Tooltip';
import DialogToolbar from '~/components/dialogs/DialogToolbar';
import FadeAndSlide from '~/components/transitions/FadeAndSlide';

import {
  copyAveragedCentroidOfSelectedUAVsToClipboard,
  pauseAveragingSelectedUAVs,
  resumeAveragingSelectedUAVs,
  restartAveragingSelectedUAVs,
  stopAveragingSelectedUAVs,
} from '~/features/measurement/actions';
import {
  finishAddingNewAveragingMeasurement,
  startAddingNewAveragingMeasurement,
  startAveragingUAVCoordinateById,
} from '~/features/measurement/slice';
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
  mode,
  onCopyCentroidOfSelection,
  onFinishAddition,
  onPauseSelected,
  onRemoveSelected,
  onRestartSelected,
  onResumeSelected,
  onStartAddition,
  onUAVIdAdded,
}) => {
  const inputRef = useRef(null);

  const onKeyDown = useCallback(
    (event) => {
      if (event.keyCode === 27) {
        // When Escape is presseed, cancel the editing mode
        event.preventDefault();
        event.stopPropagation();
        onFinishAddition();
        return false;
      }

      if (event.keyCode === 13) {
        // When Enter is pressed, commit the new value
        event.preventDefault();
        event.stopPropagation();
        onUAVIdAdded(event.target.value);
        onFinishAddition();
        return false;
      }
    },
    [onFinishAddition, onUAVIdAdded]
  );

  const onSubmit = useCallback(() => {
    if (inputRef && inputRef.current) {
      onUAVIdAdded(inputRef.current.value);
      onFinishAddition();
    }
  }, [inputRef, onFinishAddition, onUAVIdAdded]);

  return (
    <DialogToolbar disableGutters>
      <FadeAndSlide mountOnEnter unmountOnExit in={mode === 'normal'}>
        <Box position='absolute' display='flex'>
          <Tooltip content='Add new drone'>
            <IconButton onClick={onStartAddition}>
              <Add />
            </IconButton>
          </Tooltip>
          <Tooltip content='Remove selected'>
            <IconButton disabled={!hasSelection} onClick={onRemoveSelected}>
              <Remove />
            </IconButton>
          </Tooltip>
          <ToolbarDivider orientation='vertical' />
          <Tooltip content='Pause measurement'>
            <IconButton disabled={!hasMeasurements} onClick={onPauseSelected}>
              <Pause />
            </IconButton>
          </Tooltip>
          <Tooltip content='Resume measurement'>
            <IconButton disabled={!hasMeasurements} onClick={onResumeSelected}>
              <PlayArrow />
            </IconButton>
          </Tooltip>
          <Tooltip content='Reset measurement'>
            <IconButton disabled={!hasMeasurements} onClick={onRestartSelected}>
              <Replay />
            </IconButton>
          </Tooltip>
          <ToolbarDivider orientation='vertical' />
          <Tooltip content='Copy centroid'>
            <IconButton
              disabled={!hasSelection}
              onClick={onCopyCentroidOfSelection}
            >
              <ContentCopy />
            </IconButton>
          </Tooltip>
        </Box>
      </FadeAndSlide>

      {/* components should be unmounted on exit - this is needed for autoFocus to work */}
      <FadeAndSlide mountOnEnter unmountOnExit in={mode === 'adding'}>
        <Box
          position='absolute'
          width='100%'
          display='flex'
          alignItems='center'
        >
          <Box px={2}>UAV ID:</Box>
          <Box flex={1}>
            <ActiveUAVsField
              autoFocus
              fullWidth
              hideErrorMessage
              inputRef={inputRef}
              label=''
              onKeyDown={onKeyDown}
            />
          </Box>
          <IconButton onClick={onSubmit}>
            <Check />
          </IconButton>
          <IconButton onClick={onFinishAddition}>
            <Clear />
          </IconButton>
        </Box>
      </FadeAndSlide>
    </DialogToolbar>
  );
};

CoordinateAveragingDialogToolbar.propTypes = {
  hasMeasurements: PropTypes.bool,
  hasSelection: PropTypes.bool,
  mode: PropTypes.oneOf(['normal', 'adding']),
  onCopyCentroidOfSelection: PropTypes.func,
  onFinishAddition: PropTypes.func,
  onPauseSelected: PropTypes.func,
  onRemoveSelected: PropTypes.func,
  onResumeSelected: PropTypes.func,
  onRestartSelected: PropTypes.func,
  onStartAddition: PropTypes.func,
  onUAVIdAdded: PropTypes.func,
};

CoordinateAveragingDialogToolbar.defaultProps = {
  mode: 'normal',
};

export default connect(
  // mapStateToProps
  (state) => ({
    mode: state.measurement.averagingDialog.mode,
    hasMeasurements: hasActiveOrPausedAveragingMeasurements(state),
    hasSelection: hasSelectionInAveragingMeasurementDialogBox(state),
  }),

  // mapDispatchToProps
  {
    onCopyCentroidOfSelection: copyAveragedCentroidOfSelectedUAVsToClipboard,
    onFinishAddition: finishAddingNewAveragingMeasurement,
    onPauseSelected: pauseAveragingSelectedUAVs,
    onRemoveSelected: stopAveragingSelectedUAVs,
    onResumeSelected: resumeAveragingSelectedUAVs,
    onRestartSelected: restartAveragingSelectedUAVs,
    onStartAddition: startAddingNewAveragingMeasurement,
    onUAVIdAdded: startAveragingUAVCoordinateById,
  }
)(CoordinateAveragingDialogToolbar);

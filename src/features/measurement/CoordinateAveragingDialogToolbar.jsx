import Add from '@mui/icons-material/Add';
import Pause from '@mui/icons-material/Pause';
import Place from '@mui/icons-material/Place';
import PlayArrow from '@mui/icons-material/PlayArrow';
import Remove from '@mui/icons-material/Remove';
import Replay from '@mui/icons-material/Replay';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import PropTypes from 'prop-types';
import { withTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import { DialogToolbar, Tooltip } from '@skybrush/mui-components';

import ToolbarDivider from '~/components/ToolbarDivider';
import { UAVSelectorWrapper } from '~/components/uavs/UAVSelector';
import {
  copyAveragedCentroidOfSelectedUAVsToClipboard,
  pauseAveragingSelectedUAVs,
  restartAveragingSelectedUAVs,
  resumeAveragingSelectedUAVs,
  setAveragedCentroidOfSelectedUAVsAsMapOrigin,
  stopAveragingSelectedUAVs,
} from '~/features/measurement/actions';
import {
  hasActiveOrPausedAveragingMeasurements,
  hasSelectionInAveragingMeasurementDialogBox,
} from '~/features/measurement/selectors';
import { startAveragingUAVCoordinateById } from '~/features/measurement/slice';
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
  t,
}) => {
  return (
    <DialogToolbar disableGutters>
      <Box sx={{ position: 'absolute', display: 'flex' }}>
        <UAVSelectorWrapper filterable onSelect={onUAVIdAdded}>
          {(handleClick) => (
            <Tooltip
              content={t('coordinateAveragingDialogToolbar.addNewDrone')}
            >
              <IconButton color='inherit' size='large' onClick={handleClick}>
                <Add />
              </IconButton>
            </Tooltip>
          )}
        </UAVSelectorWrapper>
        <Tooltip content={t('coordinateAveragingDialogToolbar.removeSelected')}>
          <IconButton
            disabled={!hasSelection}
            color='inherit'
            size='large'
            onClick={onRemoveSelected}
          >
            <Remove />
          </IconButton>
        </Tooltip>
        <ToolbarDivider orientation='vertical' />
        <Tooltip
          content={t('coordinateAveragingDialogToolbar.pauseMeasurement')}
        >
          <IconButton
            disabled={!hasMeasurements}
            color='inherit'
            size='large'
            onClick={onPauseSelected}
          >
            <Pause />
          </IconButton>
        </Tooltip>
        <Tooltip
          content={t('coordinateAveragingDialogToolbar.resumeMeasurement')}
        >
          <IconButton
            disabled={!hasMeasurements}
            color='inherit'
            size='large'
            onClick={onResumeSelected}
          >
            <PlayArrow />
          </IconButton>
        </Tooltip>
        <Tooltip
          content={t('coordinateAveragingDialogToolbar.resetMeasurement')}
        >
          <IconButton
            disabled={!hasMeasurements || !hasSelection}
            color='inherit'
            size='large'
            onClick={onRestartSelected}
          >
            <Replay />
          </IconButton>
        </Tooltip>
        <ToolbarDivider orientation='vertical' />
        <Tooltip content={t('coordinateAveragingDialogToolbar.copyCentroid')}>
          <IconButton
            disabled={!hasMeasurements}
            color='inherit'
            size='large'
            onClick={onCopyCentroidOfSelection}
          >
            <ContentCopy />
          </IconButton>
        </Tooltip>
        <Tooltip
          content={t('coordinateAveragingDialogToolbar.setCentroidAsMapOrigin')}
        >
          <IconButton
            disabled={!hasMeasurements}
            color='inherit'
            size='large'
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
  t: PropTypes.func,
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
)(withTranslation()(CoordinateAveragingDialogToolbar));

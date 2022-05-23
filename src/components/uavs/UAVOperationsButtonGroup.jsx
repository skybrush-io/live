import isEmpty from 'lodash-es/isEmpty';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';

import Clear from '@material-ui/icons/Clear';
import Delete from '@material-ui/icons/Delete';
import FlightTakeoff from '@material-ui/icons/FlightTakeoff';
import Assignment from '@material-ui/icons/Assignment';
import FlightLand from '@material-ui/icons/FlightLand';
import Home from '@material-ui/icons/Home';
import PositionHold from '@material-ui/icons/Flag';
import Moon from '@material-ui/icons/NightsStay';
import PowerSettingsNew from '@material-ui/icons/PowerSettingsNew';
import PlayArrow from '@material-ui/icons/PlayArrow';
import Refresh from '@material-ui/icons/Refresh';
import WbSunny from '@material-ui/icons/WbSunny';

import Tooltip from '@skybrush/mui-components/lib/Tooltip';

import Colors from '~/components/colors';
import ToolbarDivider from '~/components/ToolbarDivider';
import Bolt from '~/icons/Bolt';

import { getPreferredCommunicationChannelIndex } from '~/features/mission/selectors';
import {
  requestRemovalOfUAVsByIds,
  requestRemovalOfUAVsMarkedAsGone,
} from '~/features/uavs/actions';
import { openUAVDetailsDialog } from '~/features/uavs/details';
import { createMultipleUAVRelatedActions } from '~/utils/messaging';

/**
 * Main toolbar for controlling the UAVs.
 */
const UAVOperationsButtonGroup = ({
  channel,
  hideSeparators,
  openUAVDetailsDialog,
  requestRemovalOfUAVsByIds,
  requestRemovalOfUAVsMarkedAsGone,
  selectedUAVIds,
  size,
  startSeparator,
}) => {
  const isSelectionEmpty = isEmpty(selectedUAVIds);
  const isSelectionSingle = selectedUAVIds.length === 1;

  const {
    flashLightOnUAVs,
    landUAVs,
    positionHoldUAVs,
    resetUAVs,
    returnToHomeUAVs,
    shutdownUAVs,
    sleepUAVs,
    takeoffUAVs,
    turnMotorsOffForUAVs,
    turnMotorsOnForUAVs,
    wakeUpUAVs,
  } = createMultipleUAVRelatedActions(selectedUAVIds, { channel });

  const fontSize = size === 'small' ? 'small' : 'medium';
  const iconSize = size;

  const flashLightsButton =
    size === 'small' ? (
      <Button
        startIcon={<WbSunny />}
        disabled={isSelectionEmpty}
        size={iconSize}
        onClick={flashLightOnUAVs}
      >
        Flash lights
      </Button>
    ) : (
      <Tooltip content='Flash lights'>
        <IconButton
          disabled={isSelectionEmpty}
          size={iconSize}
          onClick={flashLightOnUAVs}
        >
          <WbSunny fontSize={fontSize} />
        </IconButton>
      </Tooltip>
    );

  return (
    <>
      {!hideSeparators && startSeparator && (
        <ToolbarDivider orientation='vertical' />
      )}

      <Tooltip content='Takeoff'>
        <IconButton
          disabled={isSelectionEmpty}
          size={iconSize}
          onClick={takeoffUAVs}
        >
          <FlightTakeoff fontSize={fontSize} />
        </IconButton>
      </Tooltip>

      <Tooltip content='Position hold'>
        <IconButton
          disabled={isSelectionEmpty}
          size={iconSize}
          onClick={positionHoldUAVs}
        >
          <PositionHold fontSize={fontSize} />
        </IconButton>
      </Tooltip>

      <Tooltip content='Return to home'>
        <IconButton
          disabled={isSelectionEmpty}
          size={iconSize}
          onClick={returnToHomeUAVs}
        >
          <Home fontSize={fontSize} />
        </IconButton>
      </Tooltip>

      <Tooltip content='Land'>
        <IconButton
          disabled={isSelectionEmpty}
          size={iconSize}
          onClick={landUAVs}
        >
          <FlightLand fontSize={fontSize} />
        </IconButton>
      </Tooltip>

      {!hideSeparators && <ToolbarDivider orientation='vertical' />}

      {size !== 'small' && (
        <>
          <Tooltip content='Properties'>
            <IconButton
              disabled={!isSelectionSingle}
              size={iconSize}
              onClick={() => openUAVDetailsDialog(selectedUAVIds[0])}
            >
              <Assignment />
            </IconButton>
          </Tooltip>
          {flashLightsButton}
        </>
      )}

      {!hideSeparators && <ToolbarDivider orientation='vertical' />}

      <Tooltip content='Arm motors'>
        <IconButton
          disabled={isSelectionEmpty}
          size={iconSize}
          onClick={turnMotorsOnForUAVs}
        >
          <PlayArrow
            fontSize={fontSize}
            htmlColor={isSelectionEmpty ? undefined : Colors.warning}
          />
        </IconButton>
      </Tooltip>

      <Tooltip content='Disarm motors'>
        <IconButton
          disabled={isSelectionEmpty}
          size={iconSize}
          onClick={turnMotorsOffForUAVs}
        >
          <Clear
            fontSize={fontSize}
            htmlColor={isSelectionEmpty ? undefined : Colors.warning}
          />
        </IconButton>
      </Tooltip>

      {size === 'small' && flashLightsButton}

      {!hideSeparators && <ToolbarDivider orientation='vertical' />}

      <Tooltip content='Power on'>
        <IconButton
          disabled={isSelectionEmpty}
          size={iconSize}
          onClick={wakeUpUAVs}
        >
          <Bolt
            htmlColor={isSelectionEmpty ? undefined : Colors.success}
            fontSize={fontSize}
          />
        </IconButton>
      </Tooltip>

      <Tooltip content='Sleep'>
        <IconButton
          disabled={isSelectionEmpty}
          size={iconSize}
          onClick={sleepUAVs}
        >
          <Moon
            htmlColor={isSelectionEmpty ? undefined : Colors.warning}
            fontSize={fontSize}
          />
        </IconButton>
      </Tooltip>

      <Tooltip content='Reboot'>
        <IconButton
          disabled={isSelectionEmpty}
          size={iconSize}
          onClick={resetUAVs}
        >
          <Refresh
            htmlColor={isSelectionEmpty ? undefined : Colors.error}
            fontSize={fontSize}
          />
        </IconButton>
      </Tooltip>

      <Tooltip content='Power off'>
        <IconButton
          disabled={isSelectionEmpty}
          size={iconSize}
          onClick={shutdownUAVs}
        >
          <PowerSettingsNew
            htmlColor={isSelectionEmpty ? undefined : Colors.error}
            fontSize={fontSize}
          />
        </IconButton>
      </Tooltip>

      {size !== 'small' && (
        <>
          {!hideSeparators && <ToolbarDivider orientation='vertical' />}

          <Tooltip
            content={
              isSelectionEmpty
                ? 'Remove items marked as gone'
                : 'Remove from list'
            }
          >
            <IconButton
              size={iconSize}
              onClick={() =>
                isSelectionEmpty
                  ? requestRemovalOfUAVsMarkedAsGone()
                  : requestRemovalOfUAVsByIds(selectedUAVIds)
              }
            >
              <Delete />
            </IconButton>
          </Tooltip>
        </>
      )}
    </>
  );
};

UAVOperationsButtonGroup.propTypes = {
  channel: PropTypes.number,
  openUAVDetailsDialog: PropTypes.func,
  requestRemovalOfUAVsByIds: PropTypes.func,
  requestRemovalOfUAVsMarkedAsGone: PropTypes.func,
  selectedUAVIds: PropTypes.arrayOf(PropTypes.string),
  hideSeparators: PropTypes.bool,
  size: PropTypes.oneOf(['small', 'medium']),
  startSeparator: PropTypes.bool,
};

UAVOperationsButtonGroup.defaultProps = {
  channel: 0,
};

export default connect(
  // mapStateToProps
  (state) => ({
    channel: getPreferredCommunicationChannelIndex(state),
  }),
  // mapDispatchToProps
  /* TODO(ntamas): ask the flock object to remove the UAVs instead of removing them
   * from the store directly */
  {
    openUAVDetailsDialog,
    requestRemovalOfUAVsMarkedAsGone,
    requestRemovalOfUAVsByIds,
  }
)(UAVOperationsButtonGroup);

import Assignment from '@mui/icons-material/Assignment';
import Clear from '@mui/icons-material/Clear';
import CompassCalibration from '@mui/icons-material/CompassCalibration';
import Delete from '@mui/icons-material/Delete';
import PositionHold from '@mui/icons-material/Flag';
import FlightLand from '@mui/icons-material/FlightLand';
import FlightTakeoff from '@mui/icons-material/FlightTakeoff';
import Home from '@mui/icons-material/Home';
import Moon from '@mui/icons-material/NightsStay';
import PlayArrow from '@mui/icons-material/PlayArrow';
import PowerSettingsNew from '@mui/icons-material/PowerSettingsNew';
import Refresh from '@mui/icons-material/Refresh';
import WbSunny from '@mui/icons-material/WbSunny';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import { bindActionCreators } from '@reduxjs/toolkit';
import isEmpty from 'lodash-es/isEmpty';
import PropTypes from 'prop-types';
import React, { useCallback, useState } from 'react';
import { withTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import { useInterval } from 'react-use';

import Colors from '~/components/colors';
import ToolbarDivider from '~/components/ToolbarDivider';
import { TooltipWithContainerFromContext as Tooltip } from '~/containerContext';
import { getPreferredCommunicationChannelIndex } from '~/features/mission/selectors';
import { UAV_SIGNAL_DURATION } from '~/features/settings/constants';
import {
  requestRemovalOfUAVsByIds,
  requestRemovalOfUAVsMarkedAsGone,
} from '~/features/uavs/actions';
import { openUAVDetailsDialog } from '~/features/uavs/details';
import { getUAVIdList } from '~/features/uavs/selectors';
import Bolt from '~/icons/Bolt';
import { createUAVOperationThunks } from '~/utils/messaging';

/**
 * Main toolbar for controlling the UAVs.
 */
// eslint-disable-next-line complexity
const UAVOperationsButtonGroup = ({
  broadcast,
  dispatch,
  hideSeparators,
  openUAVDetailsDialog,
  requestRemovalOfUAVsByIds,
  requestRemovalOfUAVsMarkedAsGone,
  selectedUAVIds,
  size,
  startSeparator,
  t,
}) => {
  const isSelectionEmpty = isEmpty(selectedUAVIds) && !broadcast;
  const isSelectionSingle = selectedUAVIds.length === 1 && !broadcast;

  const {
    calibrateCompass,
    flashLight,
    holdPosition,
    land,
    reset,
    returnToHome,
    shutdown,
    sleep,
    takeOff,
    turnMotorsOff,
    turnMotorsOn,
    wakeUp,
  } = bindActionCreators(
    createUAVOperationThunks({
      getTargetedUAVIds(state) {
        return broadcast ? getUAVIdList(state) : selectedUAVIds;
      },

      getTransportOptions(state) {
        const result = {
          channel: getPreferredCommunicationChannelIndex(state),
        };

        if (broadcast) {
          result.broadcast = true;
          result.ignoreIds = true;
        }

        return result;
      },
    }),
    dispatch
  );

  const [keepFlashing, setKeepFlashing] = useState(false);
  const flashLightsButtonOnClick = useCallback(
    (event) => {
      if (keepFlashing) {
        setKeepFlashing(false);
      } else if (event.shiftKey) {
        setKeepFlashing(true);
        flashLight();
      } else {
        flashLight();
      }
    },
    [flashLight, keepFlashing, setKeepFlashing]
  );

  useInterval(flashLight, keepFlashing ? UAV_SIGNAL_DURATION * 1000 : null);

  const fontSize = size === 'small' ? 'small' : 'medium';
  const iconSize = size;

  const flashLightsButton =
    size === 'small' ? (
      <Button
        startIcon={<WbSunny color={keepFlashing ? 'primary' : undefined} />}
        disabled={isSelectionEmpty}
        size={iconSize}
        onClick={flashLightsButtonOnClick}
      >
        {t('UAVOpButtonGrp.flashLights')}
      </Button>
    ) : (
      <Tooltip content={t('UAVOpButtonGrp.flashLights')}>
        <IconButton
          disabled={isSelectionEmpty}
          size={iconSize}
          onClick={flashLightsButtonOnClick}
        >
          <WbSunny
            fontSize={fontSize}
            color={keepFlashing ? 'primary' : undefined}
          />
        </IconButton>
      </Tooltip>
    );

  return (
    <>
      {!hideSeparators && startSeparator && (
        <ToolbarDivider orientation='vertical' />
      )}

      <Tooltip content={t('general.commands.takeoff')}>
        <IconButton
          disabled={isSelectionEmpty}
          size={iconSize}
          onClick={takeOff}
        >
          <FlightTakeoff fontSize={fontSize} />
        </IconButton>
      </Tooltip>

      <Tooltip content={t('general.commands.positionHold')}>
        <IconButton
          disabled={isSelectionEmpty}
          size={iconSize}
          onClick={holdPosition}
        >
          <PositionHold fontSize={fontSize} />
        </IconButton>
      </Tooltip>

      <Tooltip content={t('general.commands.returnToHome')}>
        <IconButton
          disabled={isSelectionEmpty}
          size={iconSize}
          onClick={returnToHome}
        >
          <Home fontSize={fontSize} />
        </IconButton>
      </Tooltip>

      <Tooltip content={t('general.commands.land')}>
        <IconButton disabled={isSelectionEmpty} size={iconSize} onClick={land}>
          <FlightLand fontSize={fontSize} />
        </IconButton>
      </Tooltip>

      {!hideSeparators && <ToolbarDivider orientation='vertical' />}

      {size !== 'small' && (
        <>
          <Tooltip content={t('UAVOpButtonGrp.details')}>
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

      <Tooltip content={t('UAVOpButtonGrp.armMotors')}>
        <IconButton
          disabled={isSelectionEmpty}
          size={iconSize}
          onClick={turnMotorsOn}
        >
          <PlayArrow
            fontSize={fontSize}
            htmlColor={isSelectionEmpty ? undefined : Colors.warning}
          />
        </IconButton>
      </Tooltip>

      <Tooltip content={t('UAVOpButtonGrp.disarmMotors')}>
        <IconButton
          disabled={isSelectionEmpty}
          size={iconSize}
          onClick={turnMotorsOff}
        >
          <Clear
            fontSize={fontSize}
            htmlColor={isSelectionEmpty ? undefined : Colors.warning}
          />
        </IconButton>
      </Tooltip>

      {size === 'small' && flashLightsButton}

      {!hideSeparators && <ToolbarDivider orientation='vertical' />}

      <Tooltip content={t('general.commands.powerOn')}>
        <IconButton
          disabled={isSelectionEmpty}
          size={iconSize}
          onClick={wakeUp}
        >
          <Bolt
            htmlColor={isSelectionEmpty ? undefined : Colors.success}
            fontSize={fontSize}
          />
        </IconButton>
      </Tooltip>

      <Tooltip content={t('general.commands.sleep')}>
        <IconButton disabled={isSelectionEmpty} size={iconSize} onClick={sleep}>
          <Moon
            htmlColor={isSelectionEmpty ? undefined : Colors.warning}
            fontSize={fontSize}
          />
        </IconButton>
      </Tooltip>

      <Tooltip content={t('general.commands.reboot')}>
        <IconButton disabled={isSelectionEmpty} size={iconSize} onClick={reset}>
          <Refresh
            htmlColor={isSelectionEmpty ? undefined : Colors.error}
            fontSize={fontSize}
          />
        </IconButton>
      </Tooltip>

      <Tooltip content={t('general.commands.powerOff')}>
        <IconButton
          disabled={isSelectionEmpty}
          size={iconSize}
          onClick={shutdown}
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

          <IconButton
            size={iconSize}
            disabled={selectedUAVIds.length == 0 || selectedUAVIds.length > 40}
            onClick={() => calibrateCompass()}
          >
            <CompassCalibration />
          </IconButton>

          {!hideSeparators && <ToolbarDivider orientation='vertical' />}

          <Tooltip
            content={
              isSelectionEmpty
                ? t('UAVOpButtonGrp.removeItemsMarkedGone')
                : t('UAVOpButtonGrp.removeSelectedItems')
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
  broadcast: PropTypes.bool,
  dispatch: PropTypes.func,
  openUAVDetailsDialog: PropTypes.func,
  requestRemovalOfUAVsByIds: PropTypes.func,
  requestRemovalOfUAVsMarkedAsGone: PropTypes.func,
  selectedUAVIds: PropTypes.arrayOf(PropTypes.string),
  hideSeparators: PropTypes.bool,
  size: PropTypes.oneOf(['small', 'medium']),
  startSeparator: PropTypes.bool,
  t: PropTypes.func,
};

export default connect(
  // mapStateToProps
  () => ({}),
  // mapDispatchToProps
  (dispatch) => ({
    ...bindActionCreators(
      {
        openUAVDetailsDialog,
        requestRemovalOfUAVsMarkedAsGone,
        requestRemovalOfUAVsByIds,
      },
      dispatch
    ),
    dispatch,
  })
)(withTranslation()(UAVOperationsButtonGroup));

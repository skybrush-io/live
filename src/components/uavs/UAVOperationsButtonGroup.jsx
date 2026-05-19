import Assignment from '@mui/icons-material/Assignment';
import Clear from '@mui/icons-material/Clear';
import Delete from '@mui/icons-material/Delete';
import Explore from '@mui/icons-material/Explore';
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
import React, { useCallback, useMemo, useState } from 'react';
import { withTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import { useInterval } from 'react-use';

import Colors from '~/components/colors';
import ConfirmationDialog from '~/components/dialogs/ConfirmationDialog';
import ToolbarDivider from '~/components/ToolbarDivider';
import { TooltipWithContainerFromContext as Tooltip } from '~/containerContext';
import { getPreferredCommunicationChannelIndex } from '~/features/mission/selectors';
import { UAV_SIGNAL_DURATION } from '~/features/settings/constants';
import {
  requestRemovalOfUAVsByIds,
  requestRemovalOfUAVsMarkedAsGone,
} from '~/features/uavs/actions';
import { COMPASS_CALIB_UAV_LIMIT } from '~/features/uavs/constants';
import { openUAVDetailsDialog } from '~/features/uavs/details';
import { getUAVIdList } from '~/features/uavs/selectors';
import Bolt from '~/icons/Bolt';
import { createUAVOperationThunks } from '~/utils/messaging';

/** Text + icon flight commands on the main toolbar (readable contrast & spacing). */
const LABELED_OP_BUTTON_SX = {
  textTransform: 'none',
  fontWeight: 600,
  fontSize: '0.8125rem',
  letterSpacing: '0.01em',
  color: 'text.primary',
  px: 1.25,
  py: 0.65,
  minWidth: 'auto',
  '& .MuiButton-startIcon': {
    mr: 0.75,
    color: 'text.secondary',
    '& > *:nth-of-type(1)': {
      fontSize: '1.35rem',
    },
  },
};

const FLIGHT_COMMAND_LABEL_KEYS = {
  takeOff: 'general.commands.takeoff',
  holdPosition: 'general.commands.positionHold',
  returnToHome: 'general.commands.returnToHome',
  land: 'general.commands.land',
};

/** Toolbar accent: takeoff green, hold/RTH yellow, land red (black text on fill). */
const FLIGHT_COMMAND_COLORS = {
  takeOff: Colors.success,
  holdPosition: Colors.positionHold,
  returnToHome: Colors.positionHold,
  land: Colors.error,
};

const FLIGHT_COMMAND_FG = '#000';

const flightCommandIconButtonSx = (bgColor, isSelectionEmpty) =>
  isSelectionEmpty
    ? {}
    : {
        backgroundColor: bgColor,
        color: FLIGHT_COMMAND_FG,
        borderRadius: 1,
        '&:hover': {
          backgroundColor: bgColor,
          filter: 'brightness(0.92)',
        },
      };

const flightCommandLabeledButtonSx = (bgColor, isSelectionEmpty) => ({
  ...LABELED_OP_BUTTON_SX,
  ...(isSelectionEmpty
    ? {}
    : {
        backgroundColor: bgColor,
        color: FLIGHT_COMMAND_FG,
        borderRadius: 1,
        '&:hover': {
          backgroundColor: bgColor,
          filter: 'brightness(0.92)',
        },
        '& .MuiButton-startIcon': {
          ...LABELED_OP_BUTTON_SX['& .MuiButton-startIcon'],
          color: FLIGHT_COMMAND_FG,
          '& > *:nth-of-type(1)': {
            fontSize: '1.35rem',
          },
        },
      }),
});

/**
 * Main toolbar for controlling the UAVs.
 */
// eslint-disable-next-line complexity
const UAVOperationsButtonGroup = ({
  broadcast,
  dispatch,
  hideFlightCommands = false,
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

  const [flightConfirmOpen, setFlightConfirmOpen] = useState(false);
  const [pendingFlightCommand, setPendingFlightCommand] = useState(null);

  const requestFlightCommand = useCallback((commandKey) => {
    setPendingFlightCommand(commandKey);
    setFlightConfirmOpen(true);
  }, []);

  const handleFlightConfirmClose = useCallback(() => {
    setFlightConfirmOpen(false);
    setPendingFlightCommand(null);
  }, []);

  const handleFlightConfirmAction = useCallback(() => {
    if (!pendingFlightCommand) {
      return;
    }

    const runners = {
      takeOff,
      holdPosition,
      returnToHome,
      land,
    };
    runners[pendingFlightCommand]({
      skipUAVOperationConfirmation: true,
    });
    handleFlightConfirmClose();
  }, [
    pendingFlightCommand,
    takeOff,
    holdPosition,
    returnToHome,
    land,
    handleFlightConfirmClose,
  ]);

  const flightConfirmMessage = useMemo(() => {
    if (!pendingFlightCommand) {
      return '';
    }

    const cmdKey = FLIGHT_COMMAND_LABEL_KEYS[pendingFlightCommand];
    const commandLabel = cmdKey ? t(cmdKey) : pendingFlightCommand;

    return broadcast
      ? t('UAVOpButtonGrp.confirmFlightCommandMessageBroadcast', {
          command: commandLabel,
        })
      : t('UAVOpButtonGrp.confirmFlightCommandMessage', {
          command: commandLabel,
        });
  }, [broadcast, pendingFlightCommand, t]);

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
        variant='text'
        color='inherit'
        onClick={flashLightsButtonOnClick}
        sx={LABELED_OP_BUTTON_SX}
      >
        {t('UAVOpButtonGrp.flashLights')}
      </Button>
    ) : (
      <Tooltip content={t('UAVOpButtonGrp.flashLights')}>
        <IconButton
          disabled={isSelectionEmpty}
          size={iconSize}
          onClick={flashLightsButtonOnClick}
          sx={{ color: 'text.primary' }}
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

      {!hideFlightCommands &&
        (size === 'small' ? (
        <>
          <Tooltip content={t('general.commands.takeoff')}>
            <IconButton
              disabled={isSelectionEmpty}
              size={iconSize}
              onClick={() => requestFlightCommand('takeOff')}
              sx={flightCommandIconButtonSx(
                FLIGHT_COMMAND_COLORS.takeOff,
                isSelectionEmpty
              )}
            >
              <FlightTakeoff fontSize={fontSize} />
            </IconButton>
          </Tooltip>

          <Tooltip content={t('general.commands.positionHold')}>
            <IconButton
              disabled={isSelectionEmpty}
              size={iconSize}
              onClick={() => requestFlightCommand('holdPosition')}
              sx={flightCommandIconButtonSx(
                FLIGHT_COMMAND_COLORS.holdPosition,
                isSelectionEmpty
              )}
            >
              <PositionHold fontSize={fontSize} />
            </IconButton>
          </Tooltip>

          <Tooltip content={t('general.commands.returnToHome')}>
            <IconButton
              disabled={isSelectionEmpty}
              size={iconSize}
              onClick={() => requestFlightCommand('returnToHome')}
              sx={flightCommandIconButtonSx(
                FLIGHT_COMMAND_COLORS.returnToHome,
                isSelectionEmpty
              )}
            >
              <Home fontSize={fontSize} />
            </IconButton>
          </Tooltip>

          <Tooltip content={t('general.commands.land')}>
            <IconButton
              disabled={isSelectionEmpty}
              size={iconSize}
              onClick={() => requestFlightCommand('land')}
              sx={flightCommandIconButtonSx(
                FLIGHT_COMMAND_COLORS.land,
                isSelectionEmpty
              )}
            >
              <FlightLand fontSize={fontSize} />
            </IconButton>
          </Tooltip>
        </>
      ) : (
        <>
          <Tooltip content={t('general.commands.takeoff')}>
            <Button
              variant='text'
              color='inherit'
              disabled={isSelectionEmpty}
              size='medium'
              startIcon={<FlightTakeoff fontSize={fontSize} />}
              onClick={() => requestFlightCommand('takeOff')}
              sx={flightCommandLabeledButtonSx(
                FLIGHT_COMMAND_COLORS.takeOff,
                isSelectionEmpty
              )}
            >
              {t('general.commands.takeoff')}
            </Button>
          </Tooltip>

          <Tooltip content={t('general.commands.positionHold')}>
            <Button
              variant='text'
              color='inherit'
              disabled={isSelectionEmpty}
              size='medium'
              startIcon={<PositionHold fontSize={fontSize} />}
              onClick={() => requestFlightCommand('holdPosition')}
              sx={flightCommandLabeledButtonSx(
                FLIGHT_COMMAND_COLORS.holdPosition,
                isSelectionEmpty
              )}
            >
              {t('general.commands.positionHold')}
            </Button>
          </Tooltip>

          <Tooltip content={t('general.commands.returnToHome')}>
            <Button
              variant='text'
              color='inherit'
              disabled={isSelectionEmpty}
              size='medium'
              startIcon={<Home fontSize={fontSize} />}
              onClick={() => requestFlightCommand('returnToHome')}
              sx={flightCommandLabeledButtonSx(
                FLIGHT_COMMAND_COLORS.returnToHome,
                isSelectionEmpty
              )}
            >
              {t('general.commands.returnToHome')}
            </Button>
          </Tooltip>

          <Tooltip content={t('general.commands.land')}>
            <Button
              variant='text'
              color='inherit'
              disabled={isSelectionEmpty}
              size='medium'
              startIcon={<FlightLand fontSize={fontSize} />}
              onClick={() => requestFlightCommand('land')}
              sx={flightCommandLabeledButtonSx(
                FLIGHT_COMMAND_COLORS.land,
                isSelectionEmpty
              )}
            >
              {t('general.commands.land')}
            </Button>
          </Tooltip>
        </>
        ))}

      {!hideFlightCommands && !hideSeparators && (
        <ToolbarDivider orientation='vertical' />
      )}

      {size !== 'small' && (
        <>
          <Tooltip content={t('UAVOpButtonGrp.details')}>
            <IconButton
              disabled={!isSelectionSingle}
              size={iconSize}
              onClick={() => openUAVDetailsDialog(selectedUAVIds[0])}
              sx={{ color: 'text.primary' }}
            >
              <Assignment fontSize={fontSize} />
            </IconButton>
          </Tooltip>
          {flashLightsButton}
          <Tooltip content={t('general.commands.calibrateCompass')}>
            <IconButton
              size={iconSize}
              disabled={
                selectedUAVIds.length === 0 ||
                selectedUAVIds.length > COMPASS_CALIB_UAV_LIMIT
              }
              onClick={() => calibrateCompass()}
              sx={{ color: 'text.primary' }}
            >
              <Explore fontSize={fontSize} />
            </IconButton>
          </Tooltip>
        </>
      )}

      {!hideSeparators && <ToolbarDivider orientation='vertical' />}

      <Tooltip content={t('UAVOpButtonGrp.armMotors')}>
        <IconButton
          disabled={isSelectionEmpty}
          size={iconSize}
          onClick={turnMotorsOn}
          sx={{ color: 'text.primary' }}
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
          sx={{ color: 'text.primary' }}
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
          sx={{ color: 'text.primary' }}
        >
          <Bolt
            htmlColor={isSelectionEmpty ? undefined : Colors.success}
            fontSize={fontSize}
          />
        </IconButton>
      </Tooltip>

      <Tooltip content={t('general.commands.sleep')}>
        <IconButton
          disabled={isSelectionEmpty}
          size={iconSize}
          onClick={sleep}
          sx={{ color: 'text.primary' }}
        >
          <Moon
            htmlColor={isSelectionEmpty ? undefined : Colors.warning}
            fontSize={fontSize}
          />
        </IconButton>
      </Tooltip>

      <Tooltip content={t('general.commands.reboot')}>
        <IconButton
          disabled={isSelectionEmpty}
          size={iconSize}
          onClick={reset}
          sx={{ color: 'text.primary' }}
        >
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
          sx={{ color: 'text.primary' }}
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
              sx={{ color: 'text.primary' }}
            >
              <Delete fontSize={fontSize} />
            </IconButton>
          </Tooltip>
        </>
      )}

      {!hideFlightCommands && (
        <ConfirmationDialog
          open={flightConfirmOpen}
          message={flightConfirmMessage}
          onConfirm={handleFlightConfirmAction}
          onCancel={handleFlightConfirmClose}
        />
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
  hideFlightCommands: PropTypes.bool,
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

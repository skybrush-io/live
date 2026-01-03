import isEmpty from 'lodash-es/isEmpty';
import PropTypes from 'prop-types';
import React, { useCallback, useState } from 'react';
import { withTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import { useInterval } from 'react-use';
import { bindActionCreators } from '@reduxjs/toolkit';

import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';

import Clear from '@material-ui/icons/Clear';
import Delete from '@material-ui/icons/Delete';
import FlightTakeoff from '@material-ui/icons/FlightTakeoff';
import Assignment from '@material-ui/icons/Assignment';
import FlightLand from '@material-ui/icons/FlightLand';
import Home from '@material-ui/icons/Home';
import Pause from '@material-ui/icons/Pause';
import PositionHold from '@material-ui/icons/Flag';
import Moon from '@material-ui/icons/NightsStay';
import Manual from '@material-ui/icons/VideogameAsset';
import PowerSettingsNew from '@material-ui/icons/PowerSettingsNew';
import PlayArrow from '@material-ui/icons/PlayArrow';
import Refresh from '@material-ui/icons/Refresh';
import WbSunny from '@material-ui/icons/WbSunny';

import { TooltipWithContainerFromContext as Tooltip } from '~/containerContext';

import Colors from '~/components/colors';
import ToolbarDivider from '~/components/ToolbarDivider';
import Bolt from '~/icons/Bolt';

import { UAV_SIGNAL_DURATION } from '~/features/settings/constants';
import {
  requestRemovalOfUAVsByIds,
  requestRemovalOfUAVsMarkedAsGone,
} from '~/features/uavs/actions';
import { openUAVDetailsDialog } from '~/features/uavs/details';
import { createUAVOperationThunks } from '~/utils/messaging';
import { getPreferredCommunicationChannelIndex } from '~/features/mission/selectors';
import { getUAVIdList } from '~/features/uavs/selectors';

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
    flashLight,
    holdPosition,
    land,
    manual,
    loiter,
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

      <Tooltip content={t('general.commands.manual')}>
        <IconButton
          disabled={isSelectionEmpty}
          size={iconSize}
          onClick={manual}
        >
          <Manual fontSize={fontSize} />
        </IconButton>
      </Tooltip>

      <Tooltip content={t('general.commands.positionHold')}>
        <IconButton
          disabled={isSelectionEmpty}
          size={iconSize}
          onClick={holdPosition}
        >
          <Pause fontSize={fontSize} />
        </IconButton>
      </Tooltip>

      <Tooltip content={t('general.commands.loiter')}>
        <IconButton disabled={isSelectionEmpty} size={iconSize} onClick={loiter}>
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

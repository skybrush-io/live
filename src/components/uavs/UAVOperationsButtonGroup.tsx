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
import type { TransportOptions } from '@skybrush/flockwave-spec';
import isEmpty from 'lodash-es/isEmpty';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
import { UAV_TOOLBAR_MULTI_SELECTION_LIMIT } from '~/features/uavs/constants';
import { openUAVDetailsDialog } from '~/features/uavs/details';
import { getUAVIdList } from '~/features/uavs/selectors';
import Bolt from '~/icons/Bolt';
import type { AppDispatch, RootState } from '~/store/reducers';
import { createUAVOperationThunks } from '~/utils/messaging';

import ClearColorOverrideButton from './ClearColorOverrideButton';
import OverrideUAVColorButton from './OverrideUAVColorButton';

type Props = {
  broadcast: boolean;
  dispatch: AppDispatch;
  hideSeparators?: boolean;
  openUAVDetailsDialog: (id: string) => void;
  requestRemovalOfUAVsByIds: (ids: string[]) => void;
  requestRemovalOfUAVsMarkedAsGone: () => void;
  selectedUAVIds: string[];
  showColorOverrideBadges?: boolean;
  size?: 'small' | 'medium';
  startSeparator?: boolean;
};

// Must be valid CSS color names that are _also_ understood by the server in the
// "color" command
const COLORS: string[] = ['#ff0000', '#00ff00', '#0000ff'];

/**
 * Main toolbar for controlling the UAVs.
 */
const UAVOperationsButtonGroup = ({
  broadcast,
  dispatch,
  hideSeparators,
  openUAVDetailsDialog,
  requestRemovalOfUAVsByIds,
  requestRemovalOfUAVsMarkedAsGone,
  selectedUAVIds,
  size,
  showColorOverrideBadges,
  startSeparator,
}: Props) => {
  const { t } = useTranslation();
  const isSelectionEmpty = isEmpty(selectedUAVIds) && !broadcast;
  const isSelectionSingle = selectedUAVIds.length === 1 && !broadcast;

  const thunkOptions = {
    getTargetedUAVIds(state: RootState) {
      return broadcast ? getUAVIdList(state) : selectedUAVIds;
    },

    getTransportOptions(state: RootState) {
      const result: TransportOptions = {
        channel: getPreferredCommunicationChannelIndex(state),
      };

      if (broadcast) {
        result.broadcast = true;
        result.ignoreIds = true;
      }

      return result;
    },
  };

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
  } = bindActionCreators(createUAVOperationThunks(thunkOptions), dispatch);

  const [keepFlashing, setKeepFlashing] = useState(false);
  const flashLightsButtonOnClick = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
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
  const allowOperationForMultipleSelection =
    selectedUAVIds.length >= 1 &&
    selectedUAVIds.length <= UAV_TOOLBAR_MULTI_SELECTION_LIMIT;

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
          <Tooltip content={t('general.commands.calibrateCompass')}>
            <IconButton
              size={iconSize}
              disabled={!allowOperationForMultipleSelection}
              onClick={() => calibrateCompass()}
            >
              <Explore />
            </IconButton>
          </Tooltip>
        </>
      )}

      {!hideSeparators && <ToolbarDivider orientation='vertical' />}

      {COLORS.map((color) => (
        <OverrideUAVColorButton
          disabled={!allowOperationForMultipleSelection}
          key={color}
          color={color}
          showBadge={showColorOverrideBadges}
          uavIds={selectedUAVIds}
          size={iconSize}
        />
      ))}

      {COLORS.length > 0 && (
        <ClearColorOverrideButton uavIds={selectedUAVIds} size={iconSize} />
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
)(UAVOperationsButtonGroup);

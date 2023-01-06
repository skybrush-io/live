/* global VERSION */

import formatDate from 'date-fns/format';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import Paper from '@material-ui/core/Paper';
import Toolbar from '@material-ui/core/Toolbar';
import { makeStyles } from '@material-ui/core/styles';

import ArrowDown from '@material-ui/icons/ArrowDropDown';
import ArrowUp from '@material-ui/icons/ArrowDropUp';
import ChangeAltitudeIcon from '@material-ui/icons/Height';
import Clear from '@material-ui/icons/Clear';
import DeleteIcon from '@material-ui/icons/Delete';
import TakeoffIcon from '@material-ui/icons/FlightTakeoff';
import LandIcon from '@material-ui/icons/FlightLand';
import HomeIcon from '@material-ui/icons/Home';

import Export from '~/icons/Download';
import Import from '~/icons/Upload';

import FileButton from '~/components/FileButton';
import ToolbarDivider from '~/components/ToolbarDivider';
import { TooltipWithContainerFromContext as Tooltip } from '~/containerContext';
import {
  addNewMissionItem,
  moveSelectedMissionItemsByDelta,
  removeSelectedMissionItems,
  setMissionItemsFromArray,
  uploadMissionItemsToSelectedUAV,
} from '~/features/mission/actions';
import {
  canMoveSelectedMissionItemsDown,
  canMoveSelectedMissionItemsUp,
  getGPSBasedHomePositionsInMission,
  getMissionItemsInOrder,
  getSelectedMissionItemIds,
} from '~/features/mission/selectors';
import {
  setMappingLength,
  showMissionPlannerDialog,
  updateHomePositions,
} from '~/features/mission/slice';
import { getSingleSelectedUAVId } from '~/features/uavs/selectors';
import { MissionItemType } from '~/model/missions';
import { isConnected as isConnectedToServer } from '~/features/servers/selectors';
import { showError } from '~/features/snackbar/actions';
import { showNotification } from '~/features/snackbar/slice';
import { MessageSemantics } from '~/features/snackbar/types';
import { readFileAsText } from '~/utils/files';
import { writeTextToFile } from '~/utils/filesystem';

const useStyles = makeStyles(
  (theme) => ({
    root: {
      background: theme.palette.action.hover,
      padding: theme.spacing(0, 1),
    },
  }),
  {
    name: 'MissionOverviewPanelToolbar',
  }
);

const MissionOverviewPanelToolbar = ({
  canMoveDown,
  canMoveUp,
  canPlan,
  canUpload,
  onAddChangeAltitudeCommand,
  onAddLandCommand,
  onAddReturnToHomeCommand,
  onAddTakeoffCommand,
  onClearMission,
  onExportMission,
  onImportMission,
  onMoveDown,
  onMoveUp,
  onShowMissionPlannerDialog,
  onRemoveSelectedMissionItems,
  onUploadMissionItems,
  selectedIds,
}) => {
  const classes = useStyles();
  const hasSelection = Array.isArray(selectedIds) && selectedIds.length > 0;
  return (
    <Paper square className={classes.root} elevation={4}>
      <Toolbar
        disableGutters
        variant='dense'
        style={{ height: 36, minHeight: 36 }}
      >
        <Tooltip content='Clear mission' placement='top'>
          <IconButton size='small' onClick={onClearMission}>
            <Clear fontSize='small' />
          </IconButton>
        </Tooltip>
        <Tooltip content='Import mission' placement='top'>
          <FileButton
            style={{ minWidth: '26px' }}
            filter={['.json']}
            onSelected={onImportMission}
          >
            <Import fontSize='small' />
          </FileButton>
        </Tooltip>
        <Tooltip content='Export mission' placement='top'>
          <IconButton size='small' onClick={onExportMission}>
            <Export fontSize='small' />
          </IconButton>
        </Tooltip>
        <ToolbarDivider orientation='vertical' />
        <Box component='div' flex={1} />
        <Tooltip content='Add takeoff command' placement='top'>
          <IconButton size='small' onClick={onAddTakeoffCommand}>
            <TakeoffIcon fontSize='small' />
          </IconButton>
        </Tooltip>
        <Tooltip content='Add return to home' placement='top'>
          <IconButton size='small' onClick={onAddReturnToHomeCommand}>
            <HomeIcon fontSize='small' />
          </IconButton>
        </Tooltip>
        <Tooltip content='Add land command' placement='top'>
          <IconButton size='small' onClick={onAddLandCommand}>
            <LandIcon fontSize='small' />
          </IconButton>
        </Tooltip>
        <Tooltip content='Add altitude change' placement='top'>
          <IconButton size='small' onClick={onAddChangeAltitudeCommand}>
            <ChangeAltitudeIcon fontSize='small' />
          </IconButton>
        </Tooltip>
        <Box component='div' flex={1} />
        <ToolbarDivider orientation='vertical' />
        <Tooltip content='Move selected mission items up' placement='top'>
          <IconButton size='small' disabled={!canMoveUp} onClick={onMoveUp}>
            <ArrowUp fontSize='small' />
          </IconButton>
        </Tooltip>
        <Tooltip content='Move selected mission items down' placement='top'>
          <IconButton size='small' disabled={!canMoveDown} onClick={onMoveDown}>
            <ArrowDown fontSize='small' />
          </IconButton>
        </Tooltip>
        <ToolbarDivider orientation='vertical' />
        <Tooltip content='Remove selected mission items' placement='top'>
          <IconButton
            disabled={!hasSelection}
            size='small'
            onClick={onRemoveSelectedMissionItems}
          >
            <DeleteIcon fontSize='small' />
          </IconButton>
        </Tooltip>
        <ToolbarDivider orientation='vertical' />
        <Button
          disabled={!canPlan}
          size='small'
          onClick={onShowMissionPlannerDialog}
        >
          Plan
        </Button>
        <Button
          color='primary'
          disabled={!canUpload}
          size='small'
          onClick={onUploadMissionItems}
        >
          Upload
        </Button>
      </Toolbar>
    </Paper>
  );
};

MissionOverviewPanelToolbar.propTypes = {
  canMoveDown: PropTypes.bool,
  canMoveUp: PropTypes.bool,
  canPlan: PropTypes.bool,
  canUpload: PropTypes.bool,
  onAddChangeAltitudeCommand: PropTypes.func,
  onAddLandCommand: PropTypes.func,
  onAddReturnToHomeCommand: PropTypes.func,
  onAddTakeoffCommand: PropTypes.func,
  onClearMission: PropTypes.func,
  onExportMission: PropTypes.func,
  onImportMission: PropTypes.func,
  onMoveDown: PropTypes.func,
  onMoveUp: PropTypes.func,
  onShowMissionPlannerDialog: PropTypes.func,
  onRemoveSelectedMissionItems: PropTypes.func,
  onUploadMissionItems: PropTypes.func,
  selectedIds: PropTypes.arrayOf(PropTypes.string),
};

export default connect(
  // mapStateToProps
  (state) => ({
    canMoveDown: canMoveSelectedMissionItemsDown(state),
    canMoveUp: canMoveSelectedMissionItemsUp(state),
    canPlan: isConnectedToServer(state),
    canUpload:
      isConnectedToServer(state) && getSingleSelectedUAVId(state) !== undefined,
    onExportMission() {
      // ISO format cannot be used because colons are usually not allowed in
      // filenames
      const date = formatDate(new Date(), 'yyyy-MM-dd_HH-mm-ss');
      const missionData = {
        items: getMissionItemsInOrder(state),
        homePositions: getGPSBasedHomePositionsInMission(state),
      };
      const metaData = { exportedAt: date, skyBrushVersion: VERSION };
      writeTextToFile(
        JSON.stringify({ meta: metaData, mission: missionData }, null, 2),
        `mission-export-${date}.json`,
        { title: 'Export mission data' }
      );
    },
    selectedIds: getSelectedMissionItemIds(state),
  }),
  // mapDispatchToProps
  {
    onAddChangeAltitudeCommand: () =>
      addNewMissionItem(MissionItemType.CHANGE_ALTITUDE),
    onAddLandCommand: () => addNewMissionItem(MissionItemType.LAND),
    onAddTakeoffCommand: () => addNewMissionItem(MissionItemType.TAKEOFF),
    onAddReturnToHomeCommand: () =>
      addNewMissionItem(MissionItemType.RETURN_TO_HOME),
    onClearMission: () => setMissionItemsFromArray([]),
    onImportMission: (file) => async (dispatch) => {
      try {
        const data = JSON.parse(await readFileAsText(file));
        dispatch(setMissionItemsFromArray(data.mission.items));
        dispatch(setMappingLength(data.mission.homePositions.length));
        dispatch(updateHomePositions(data.mission.homePositions));
        dispatch(
          showNotification({
            message: 'Successfully imported mission',
            semantics: MessageSemantics.SUCCESS,
          })
        );
      } catch (error) {
        dispatch(showError(`Error while importing mission: ${error}`));
      }
    },
    onMoveDown: () => moveSelectedMissionItemsByDelta(1),
    onMoveUp: () => moveSelectedMissionItemsByDelta(-1),
    onRemoveSelectedMissionItems: removeSelectedMissionItems,
    onShowMissionPlannerDialog: showMissionPlannerDialog,
    onUploadMissionItems: uploadMissionItemsToSelectedUAV,
  }
)(MissionOverviewPanelToolbar);

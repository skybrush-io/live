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

import Clear from '@material-ui/icons/Clear';

import Export from '~/icons/Download';
import Import from '~/icons/Upload';

import FileButton from '~/components/FileButton';
import { TooltipWithContainerFromContext as Tooltip } from '~/containerContext';
import {
  setMissionItemsFromArray,
  uploadMissionItemsToSelectedUAV,
} from '~/features/mission/actions';
import {
  getGPSBasedHomePositionsInMission,
  getMissionItemsInOrder,
} from '~/features/mission/selectors';
import {
  setMappingLength,
  showMissionPlannerDialog,
  updateHomePositions,
} from '~/features/mission/slice';
import { getSingleSelectedUAVId } from '~/features/uavs/selectors';
import { isConnected as isConnectedToServer } from '~/features/servers/selectors';
import { showError, showSuccess } from '~/features/snackbar/actions';
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
    name: 'MissionOverviewPanelHeader',
  }
);

const MissionOverviewPanelHeader = ({
  canPlan,
  canUpload,
  onClearMission,
  onExportMission,
  onImportMission,
  onShowMissionPlannerDialog,
  onUploadMissionItems,
}) => {
  const classes = useStyles();
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
        <Box component='div' flex={1} />
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

MissionOverviewPanelHeader.propTypes = {
  canPlan: PropTypes.bool,
  canUpload: PropTypes.bool,
  onClearMission: PropTypes.func,
  onExportMission: PropTypes.func,
  onImportMission: PropTypes.func,
  onShowMissionPlannerDialog: PropTypes.func,
  onUploadMissionItems: PropTypes.func,
};

export default connect(
  // mapStateToProps
  (state) => ({
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
  }),
  // mapDispatchToProps
  {
    onClearMission: () => setMissionItemsFromArray([]),
    onImportMission: (file) => async (dispatch) => {
      try {
        const data = JSON.parse(await readFileAsText(file));
        dispatch(setMissionItemsFromArray(data.mission.items));
        dispatch(setMappingLength(data.mission.homePositions.length));
        dispatch(updateHomePositions(data.mission.homePositions));
        dispatch(showSuccess('Successfully imported mission'));
      } catch (error) {
        dispatch(showError(`Error while importing mission: ${error}`));
      }
    },
    onShowMissionPlannerDialog: showMissionPlannerDialog,
    onUploadMissionItems: uploadMissionItemsToSelectedUAV,
  }
)(MissionOverviewPanelHeader);

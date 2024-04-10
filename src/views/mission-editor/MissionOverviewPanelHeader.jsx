import PropTypes from 'prop-types';
import React, { useCallback } from 'react';
import { connect } from 'react-redux';

import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import Paper from '@material-ui/core/Paper';
import Toolbar from '@material-ui/core/Toolbar';
import { makeStyles } from '@material-ui/core/styles';

import Clear from '@material-ui/icons/Clear';
import DeleteForever from '@material-ui/icons/DeleteForever';
import PlayArrow from '@material-ui/icons/PlayArrow';

import Export from '~/icons/Download';
import Import from '~/icons/Upload';

import FileButton from '~/components/FileButton';
import {
  PopoverWithContainerFromContext as Popover,
  TooltipWithContainerFromContext as Tooltip,
} from '~/containerContext';
import {
  clearMission,
  exportMission,
  importMission,
  invokeMissionPlanner,
} from '~/features/mission/actions';
import { MISSION_ITEM_UPLOAD_JOB } from '~/features/mission/constants';
import {
  getUAVIdsParticipatingInMission,
  isMissionPartiallyCompleted,
} from '~/features/mission/selectors';
import { showMissionPlannerDialog } from '~/features/mission/slice';
import { isConnected as isConnectedToServer } from '~/features/servers/selectors';
import { getUAVById } from '~/features/uavs/selectors';
import { openUploadDialogForJob } from '~/features/upload/slice';
import UAVErrorCode from '~/flockwave/UAVErrorCode';
import usePopover from '~/hooks/usePopover';

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
  canResume,
  canUpload,
  onClearMission,
  onExportMission,
  onImportMission,
  onInvokePlanner,
  onShowMissionPlannerDialog,
  onUploadMissionItems,
}) => {
  const classes = useStyles();

  const [planPopupAnchor, openPlanPopup, closePlanPopup] = usePopover();

  const showMissionPlannerDialog = useCallback(() => {
    closePlanPopup();
    onShowMissionPlannerDialog();
  }, [closePlanPopup, onShowMissionPlannerDialog]);

  const resumeMission = useCallback(() => {
    closePlanPopup();
    onInvokePlanner({ resume: true });
  }, [closePlanPopup, onInvokePlanner]);

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
          onClick={canResume ? openPlanPopup : showMissionPlannerDialog}
        >
          Plan
        </Button>
        <Popover
          open={Boolean(planPopupAnchor)}
          anchorEl={planPopupAnchor}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'center',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'center',
          }}
          onClose={closePlanPopup}
        >
          <Button
            disabled={!canPlan}
            size='small'
            startIcon={<DeleteForever />}
            onClick={showMissionPlannerDialog}
          >
            New
          </Button>
          <Button
            disabled={!canPlan}
            size='small'
            startIcon={<PlayArrow />}
            onClick={resumeMission}
          >
            Resume
          </Button>
        </Popover>
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
  canResume: PropTypes.bool,
  canUpload: PropTypes.bool,
  onClearMission: PropTypes.func,
  onExportMission: PropTypes.func,
  onImportMission: PropTypes.func,
  onInvokePlanner: PropTypes.func,
  onShowMissionPlannerDialog: PropTypes.func,
  onUploadMissionItems: PropTypes.func,
};

export default connect(
  // mapStateToProps
  (state) => ({
    canPlan: isConnectedToServer(state),
    canResume: isMissionPartiallyCompleted(state),
    canUpload: (({ uavIdsParticipatingInMission }) =>
      isConnectedToServer(state) &&
      uavIdsParticipatingInMission.some((uavId) =>
        getUAVById(state, uavId)?.errors?.includes(UAVErrorCode.ON_GROUND)
      ))({
      uavIdsParticipatingInMission: getUAVIdsParticipatingInMission(state),
    }),
  }),
  // mapDispatchToProps
  {
    onClearMission: clearMission,
    onExportMission: exportMission,
    onImportMission: importMission,
    onInvokePlanner: invokeMissionPlanner,
    onShowMissionPlannerDialog: showMissionPlannerDialog,
    onUploadMissionItems: () =>
      openUploadDialogForJob({
        job: MISSION_ITEM_UPLOAD_JOB,
      }),
  }
)(MissionOverviewPanelHeader);

import Clear from '@mui/icons-material/Clear';
import DeleteForever from '@mui/icons-material/DeleteForever';
import PlayArrow from '@mui/icons-material/PlayArrow';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Toolbar from '@mui/material/Toolbar';
import { useCallback } from 'react';
import { connect } from 'react-redux';

import { makeStyles } from '@skybrush/app-theme-mui';

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
import Export from '~/icons/Download';
import Import from '~/icons/Upload';
import type { MissionIndex } from '~/model/missions';
import type { RootState } from '~/store/reducers';

const useStyles = makeStyles((theme) => ({
  root: {
    background: theme.palette.action.hover,
    padding: theme.spacing(0, 1),
  },
}));

type Props = {
  canPlan: boolean;
  canResume: boolean;
  canUpload: boolean;
  onClearMission: () => void;
  onExportMission: () => void;
  onImportMission: (file: File) => void;
  onInvokePlanner: (options: { resume?: boolean }) => void;
  onShowMissionPlannerDialog: () => void;
  onUploadMissionItems: () => void;
};

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
}: Props) => {
  const classes = useStyles();

  const [planPopupAnchor, openPlanPopup, closePlanPopup] =
    usePopover<HTMLButtonElement>();

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
        <Box component='div' sx={{ flex: 1 }} />
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

export default connect(
  // mapStateToProps
  (state: RootState) => {
    // NOTE: The selector is called without a mission index here; the selector
    // family handles an undefined index (no mission selected), although its
    // declared parameter type is narrower than that.
    const missionIndex = undefined as MissionIndex | undefined;
    return {
      canPlan: isConnectedToServer(state),
      canResume: isMissionPartiallyCompleted(
        state,
        missionIndex as MissionIndex
      ),
      canUpload:
        isConnectedToServer(state) &&
        getUAVIdsParticipatingInMission(state).some((uavId) =>
          getUAVById(state, uavId)?.errors?.includes(UAVErrorCode.ON_GROUND)
        ),
    };
  },
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

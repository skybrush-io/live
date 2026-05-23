import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import { connect } from 'react-redux';

import { makeStyles } from '@skybrush/app-theme-mui';

import DroneAvatar from '~/components/uavs/DroneAvatar';
import UAVOperationsButtonGroup from '~/components/uavs/UAVOperationsButtonGroup';
import { UAVSelectorWrapper } from '~/components/uavs/UAVSelector';
import type { RootState } from '~/store/reducers';

import { UAV_DETAILS_DIALOG_SIDEBAR_WIDTH as WIDTH } from './constants';
import {
  getSelectedUAVIdInUAVDetailsDialog,
  setSelectedUAVIdInUAVDetailsDialog,
} from './details';
import StatusSummaryMiniTable from './StatusSummaryMiniTable';

const useStyles = makeStyles((theme) => ({
  root: {
    padding: theme.spacing(2),
    minWidth: WIDTH,
  },
  toolbar: {
    justifyContent: 'center',
    padding: theme.spacing(1, 0),
  },
  toolbarInner: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    maxWidth: 144 /* 20px for the icon, 8px for the padding around the icons, four icons per row */,
    '& > button': {
      padding: 8,
    },
  },
}));

type UAVDetailsDialogSidebarProps = {
  setUAVId: (uavId?: string) => void;
  uavId?: string;
};

/**
 * Sidebar of the UAV details dialog.
 */
const UAVDetailsDialogSidebar = ({
  uavId,
  setUAVId,
}: UAVDetailsDialogSidebarProps) => {
  const classes = useStyles();
  return (
    <Box className={classes.root}>
      <UAVSelectorWrapper
        sortedByError
        onSelect={({ uavId }) => setUAVId(uavId)}
      >
        {(handleClick) => (
          <DroneAvatar
            id={uavId}
            AvatarProps={{ onClick: handleClick, style: { cursor: 'pointer' } }}
          />
        )}
      </UAVSelectorWrapper>
      <Toolbar disableGutters variant='dense' className={classes.toolbar}>
        <Box className={classes.toolbarInner}>
          <UAVOperationsButtonGroup
            hideSeparators
            broadcast={false}
            selectedUAVIds={uavId ? [uavId] : []}
            size='small'
          />
        </Box>
      </Toolbar>
      <StatusSummaryMiniTable uavId={uavId} />
    </Box>
  );
};

export default connect(
  // mapStateToProps
  (state: RootState) => ({
    uavId: getSelectedUAVIdInUAVDetailsDialog(state),
  }),
  // mapDispatchToProps
  {
    setUAVId: setSelectedUAVIdInUAVDetailsDialog,
  }
)(UAVDetailsDialogSidebar);

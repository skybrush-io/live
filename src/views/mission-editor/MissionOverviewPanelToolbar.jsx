import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import Box from '@material-ui/core/Box';
import IconButton from '@material-ui/core/IconButton';
import Paper from '@material-ui/core/Paper';
import Toolbar from '@material-ui/core/Toolbar';
import { makeStyles } from '@material-ui/core/styles';

import ArrowDown from '@material-ui/icons/ArrowDropDown';
import ArrowUp from '@material-ui/icons/ArrowDropUp';
import TakeoffIcon from '@material-ui/icons/FlightTakeoff';
import LandIcon from '@material-ui/icons/FlightLand';
import HomeIcon from '@material-ui/icons/Home';
import DeleteIcon from '@material-ui/icons/Delete';

import {
  addNewMissionItem,
  moveSelectedMissionItemsByDelta,
  removeSelectedMissionItems,
} from '~/features/mission/actions';
import {
  canMoveSelectedMissionItemsDown,
  canMoveSelectedMissionItemsUp,
  getSelectedMissionItemIds,
} from '~/features/mission/selectors';
import { MissionItemType } from '~/model/missions';
import ToolbarDivider from '~/components/ToolbarDivider';

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
  onAddLand,
  onAddReturnToHome,
  onAddTakeoff,
  onMoveDown,
  onMoveUp,
  onRemoveSelectedMissionItems,
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
        <IconButton size='small' onClick={onAddTakeoff}>
          <TakeoffIcon fontSize='small' />
        </IconButton>
        <IconButton size='small' onClick={onAddReturnToHome}>
          <HomeIcon fontSize='small' />
        </IconButton>
        <IconButton size='small' onClick={onAddLand}>
          <LandIcon fontSize='small' />
        </IconButton>
        <Box component='div' flex={1} />
        <IconButton size='small' disabled={!canMoveUp} onClick={onMoveUp}>
          <ArrowUp fontSize='small' />
        </IconButton>
        <IconButton size='small' disabled={!canMoveDown} onClick={onMoveDown}>
          <ArrowDown fontSize='small' />
        </IconButton>
        <ToolbarDivider orientation='vertical' />
        <IconButton
          disabled={!hasSelection}
          size='small'
          onClick={onRemoveSelectedMissionItems}
        >
          <DeleteIcon fontSize='small' />
        </IconButton>
      </Toolbar>
    </Paper>
  );
};

MissionOverviewPanelToolbar.propTypes = {
  canMoveDown: PropTypes.bool,
  canMoveUp: PropTypes.bool,
  onAddTakeoff: PropTypes.func,
  onAddLand: PropTypes.func,
  onAddReturnToHome: PropTypes.func,
  onMoveDown: PropTypes.func,
  onMoveUp: PropTypes.func,
  onRemoveSelectedMissionItems: PropTypes.func,
  selectedIds: PropTypes.arrayOf(PropTypes.string),
};

export default connect(
  // mapStateToProps
  (state) => ({
    canMoveDown: canMoveSelectedMissionItemsDown(state),
    canMoveUp: canMoveSelectedMissionItemsUp(state),
    selectedIds: getSelectedMissionItemIds(state),
  }),
  // mapDispatchToProps
  {
    onAddLand: () => addNewMissionItem(MissionItemType.LAND),
    onAddTakeoff: () => addNewMissionItem(MissionItemType.TAKEOFF),
    onAddReturnToHome: () => addNewMissionItem(MissionItemType.RETURN_TO_HOME),
    onMoveDown: () => moveSelectedMissionItemsByDelta(1),
    onMoveUp: () => moveSelectedMissionItemsByDelta(-1),
    onRemoveSelectedMissionItems: removeSelectedMissionItems,
  }
)(MissionOverviewPanelToolbar);

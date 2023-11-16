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
import DeleteIcon from '@material-ui/icons/Delete';

import ToolbarDivider from '~/components/ToolbarDivider';
import { TooltipWithContainerFromContext as Tooltip } from '~/containerContext';
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
import {
  iconForMissionItemType,
  MissionItemType,
  titleForMissionItemType,
} from '~/model/missions';

const useStyles = makeStyles(
  (theme) => ({
    root: {
      background: theme.palette.action.hover,
      padding: theme.spacing(0, 1),
    },
  }),
  {
    name: 'MissionOverviewPanelFooter',
  }
);

const availableMissionItemTypes = [
  MissionItemType.TAKEOFF,
  MissionItemType.RETURN_TO_HOME,
  MissionItemType.LAND,
  MissionItemType.CHANGE_ALTITUDE,
];

const MissionOverviewPanelFooter = ({
  addNewMissionItem,
  canMoveDown,
  canMoveUp,
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
        {availableMissionItemTypes.map((type) => (
          <Tooltip
            key={`add-${type}`}
            content={`Add '${titleForMissionItemType[type]}' command`}
            placement='top'
          >
            <IconButton size='small' onClick={() => addNewMissionItem(type)}>
              {React.cloneElement(iconForMissionItemType[type], {
                fontSize: 'small',
              })}
            </IconButton>
          </Tooltip>
        ))}

        <Box flex={1} />

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
      </Toolbar>
    </Paper>
  );
};

MissionOverviewPanelFooter.propTypes = {
  addNewMissionItem: PropTypes.func,
  canMoveDown: PropTypes.bool,
  canMoveUp: PropTypes.bool,
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
    addNewMissionItem,
    onAddChangeAltitudeCommand: () =>
      addNewMissionItem(MissionItemType.CHANGE_ALTITUDE),
    onAddLandCommand: () => addNewMissionItem(MissionItemType.LAND),
    onAddTakeoffCommand: () => addNewMissionItem(MissionItemType.TAKEOFF),
    onAddReturnToHomeCommand: () =>
      addNewMissionItem(MissionItemType.RETURN_TO_HOME),
    onMoveDown: () => moveSelectedMissionItemsByDelta(1),
    onMoveUp: () => moveSelectedMissionItemsByDelta(-1),
    onRemoveSelectedMissionItems: removeSelectedMissionItems,
  }
)(MissionOverviewPanelFooter);

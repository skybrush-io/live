import ArrowDown from '@mui/icons-material/ArrowDropDown';
import ArrowUp from '@mui/icons-material/ArrowDropUp';
import DeleteIcon from '@mui/icons-material/Delete';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Toolbar from '@mui/material/Toolbar';
import { cloneElement, type ReactElement } from 'react';
import { connect } from 'react-redux';

import { makeStyles } from '@skybrush/app-theme-mui';

import ToolbarDivider from '~/components/ToolbarDivider';
import { TooltipWithContainerFromContext as Tooltip } from '~/containerContext';
import {
  addNewMissionItem,
  editMissionItemParameters,
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
  schemaForMissionItemType,
  titleForMissionItemType,
} from '~/model/missions';
import type { AppThunk, RootState } from '~/store/reducers';

const useStyles = makeStyles((theme) => ({
  root: {
    background: theme.palette.action.hover,
    padding: theme.spacing(0, 1),
  },
}));

const availableMissionItemTypes = [
  MissionItemType.TAKEOFF,
  MissionItemType.RETURN_TO_HOME,
  MissionItemType.LAND,
  MissionItemType.CHANGE_ALTITUDE,
];

type Props = {
  addNewMissionItem: (type: MissionItemType) => void;
  canMoveDown: boolean;
  canMoveUp: boolean;
  onMoveDown: () => void;
  onMoveUp: () => void;
  onRemoveSelectedMissionItems: () => void;
  selectedIds?: string[];
};

/**
 * Thunk that adds a new mission item of the given type to the mission and
 * opens the parameter editor dialog for it if it has any parameters.
 */
const addNewMissionItemWithParameterEditor =
  (type: MissionItemType): AppThunk =>
  (dispatch) => {
    const item = dispatch(addNewMissionItem(type));
    if (Object.keys(schemaForMissionItemType[type].properties).length > 0) {
      void dispatch(editMissionItemParameters(item.id));
    }
  };

const MissionOverviewPanelFooter = ({
  addNewMissionItem,
  canMoveDown,
  canMoveUp,
  onMoveDown,
  onMoveUp,
  onRemoveSelectedMissionItems,
  selectedIds,
}: Props) => {
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
              {cloneElement(
                iconForMissionItemType[type] as ReactElement<{
                  fontSize?: string;
                }>,
                {
                  fontSize: 'small',
                }
              )}
            </IconButton>
          </Tooltip>
        ))}

        <Box sx={{ flex: 1 }} />

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

export default connect(
  // mapStateToProps
  (state: RootState) => ({
    canMoveDown: canMoveSelectedMissionItemsDown(state),
    canMoveUp: canMoveSelectedMissionItemsUp(state),
    selectedIds: getSelectedMissionItemIds(state),
  }),
  // mapDispatchToProps
  {
    addNewMissionItem: addNewMissionItemWithParameterEditor,
    onMoveDown: () => moveSelectedMissionItemsByDelta(1),
    onMoveUp: () => moveSelectedMissionItemsByDelta(-1),
    onRemoveSelectedMissionItems: removeSelectedMissionItems,
  }
)(MissionOverviewPanelFooter);

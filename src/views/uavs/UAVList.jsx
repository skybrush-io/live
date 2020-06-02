/**
 * @file Component that displays the status of the known UAVs in a Skybrush
 * flock.
 */

import difference from 'lodash-es/difference';
import isNil from 'lodash-es/isNil';
import union from 'lodash-es/union';
import PropTypes from 'prop-types';
import React, { useCallback, useMemo } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { connect } from 'react-redux';

import AppBar from '@material-ui/core/AppBar';
import Box from '@material-ui/core/Box';
import makeStyles from '@material-ui/core/styles/makeStyles';

import DroneAvatar from './DroneAvatar';
import DroneListItem from './DroneListItem';
import DroneStatusLine from './DroneStatusLine';
import MappingEditorToolbar from './MappingEditorToolbar';
import MappingSlotEditor from './MappingSlotEditor';
import MappingSlotEditorToolbar from './MappingSlotEditorToolbar';
import UAVListSubheader from './UAVListSubheader';
import UAVToolbar from './UAVToolbar';

import { setSelectedUAVIds } from '~/actions/map';
import { createSelectionHandlerFactory } from '~/components/helpers/lists';
import FadeAndSlide from '~/components/transitions/FadeAndSlide';
import DronePlaceholder from '~/components/uavs/DronePlaceholder';
import {
  adjustMissionMapping,
  startMappingEditorSessionAtSlot,
} from '~/features/mission/slice';
import {
  getIndexOfMappingSlotBeingEdited,
  isMappingEditable,
} from '~/features/mission/selectors';
import { getUAVListLayout } from '~/features/settings/selectors';
import { getSelectedUAVIds } from '~/selectors/selection';
import { isDark } from '~/theme';

import {
  deletionMarker,
  getDisplayedIdList,
  getSelectionInfo,
} from './selectors';

const useListStyles = makeStyles(
  (theme) => ({
    appBar: {
      backgroundColor: isDark(theme) ? '#444' : theme.palette.background.paper,
      height: 48,
    },

    toolbar: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0,
    },
  }),
  { name: 'UAVList' }
);

const useListSectionStyles = makeStyles(
  (theme) => ({
    grid: {
      display: 'flex',
      flexDirection: 'row',
      flexWrap: 'wrap',

      '&>div': {
        padding: theme.spacing(1),
      },
    },

    list: {
      display: 'flex',
      alignItems: 'stretch',
      flexDirection: 'column',
      fontSize: '12px',

      '&>div': {
        padding: theme.spacing(0.5),
        borderBottom: `1px solid ${theme.palette.divider}`,
      },

      '&>div:first-child': {
        borderTop: `1px solid ${theme.palette.divider}`,
      },
    },
  }),
  { name: 'UAVListSection' }
);

/**
 * Helper function to create the items in the grid view of drone avatars and
 * placeholders.
 */
const createGridItems = (
  items,
  { draggable, mappingSlotBeingEdited, onDropped, onSelected, selectedUAVIds }
) =>
  items.map((item) => {
    const [uavId, missionIndex, label] = item;
    const editing =
      mappingSlotBeingEdited !== undefined &&
      missionIndex === mappingSlotBeingEdited;
    const selected = selectedUAVIds.includes(uavId);
    const listItemProps = {
      onClick: onSelected ? onSelected(uavId, missionIndex) : undefined,
      onDrop: onDropped ? onDropped(missionIndex) : undefined,
      editing,
      selected,
    };

    if (item === deletionMarker) {
      listItemProps.fill = true;
    }

    return uavId === undefined ? (
      <DroneListItem
        key={`placeholder-${label || 'null'}`}
        onDrop={onDropped ? onDropped(missionIndex) : undefined}
        {...listItemProps}
      >
        {editing && <MappingSlotEditor />}
        <DronePlaceholder
          editing={editing}
          label={editing ? '' : label}
          status={missionIndex === undefined ? 'error' : 'off'}
        />
      </DroneListItem>
    ) : (
      <DroneListItem
        key={uavId}
        draggable={draggable}
        uavId={uavId}
        {...listItemProps}
      >
        {editing && <MappingSlotEditor />}
        <DroneAvatar
          id={uavId}
          editing={editing}
          label={editing ? '' : label}
          selected={selected}
        />
      </DroneListItem>
    );
  });

/**
 * Helper function to create the items in the list view of drone avatars and
 * placeholders.
 */
const createListItems = (
  items,
  { mappingSlotBeingEdited, onDropped, onSelected, selectedUAVIds }
) =>
  items.map((item) => {
    const [uavId, missionIndex, label] = item;
    const editing =
      mappingSlotBeingEdited !== undefined &&
      missionIndex === mappingSlotBeingEdited;
    const selected = selectedUAVIds.includes(uavId);
    const listItemProps = {
      onClick: onSelected ? onSelected(uavId, missionIndex) : undefined,
      onDrop: onDropped ? onDropped(missionIndex) : undefined,
      editing,
      selected,
    };
    const key = uavId === undefined ? `placeholder-${label || 'null'}` : uavId;

    if (item === deletionMarker) {
      listItemProps.fill = true;
    }

    return (
      <DroneListItem key={key} stretch {...listItemProps}>
        <DroneStatusLine id={uavId} label={label} selected={selected} />
      </DroneListItem>
    );
  });

const UAVListSection = ({
  forceVisible,
  ids,
  layout,
  listItemProps,
  ...rest
}) => {
  const classes = useListSectionStyles();

  if (ids.length <= 0 && !forceVisible) {
    return null;
  }

  const itemFactory = layout === 'grid' ? createGridItems : createListItems;
  return (
    <>
      <UAVListSubheader {...rest} />
      <Box className={layout === 'grid' ? classes.grid : classes.list}>
        {itemFactory(ids, listItemProps)}
      </Box>
    </>
  );
};

UAVListSection.propTypes = {
  forceVisible: PropTypes.bool,
  ids: PropTypes.array,
  layout: PropTypes.oneOf(['grid', 'list']),
  listItemProps: PropTypes.object,
};

/**
 * Presentation component for showing the drone show configuration view.
 */
const UAVListPresentation = ({
  editingMapping,
  layout,
  mappingSlotBeingEdited,
  onEditMappingSlot,
  onMappingAdjusted,
  onSelectionChanged,
  onSelectSection,
  selectedUAVIds,
  selectionInfo,
  uavIds,
}) => {
  const classes = useListStyles();

  const onUpdateSelection = useMemo(
    () =>
      createSelectionHandlerFactory({
        getSelection: () => selectedUAVIds,
        setSelection: onSelectionChanged,
      }),
    [selectedUAVIds, onSelectionChanged]
  );

  const onDropped = useCallback(
    (targetIndex) => (droppedUAVId) =>
      onMappingAdjusted({
        uavId: droppedUAVId,
        to: targetIndex,
      }),
    [onMappingAdjusted]
  );

  const onStartEditing = useCallback(
    (uavId, missionIndex) => () => onEditMappingSlot(missionIndex),
    [onEditMappingSlot]
  );

  const { mainUAVIds, spareUAVIds, extraSlots } = uavIds;

  const listItemProps = {
    draggable: editingMapping,
    mappingSlotBeingEdited,
    onDropped: editingMapping && onDropped,
    onSelected: editingMapping ? onStartEditing : onUpdateSelection,
    selectedUAVIds,
  };

  const mainBox = (
    <Box display='flex' flexDirection='column' height='100%'>
      <AppBar color='default' position='static' className={classes.appBar}>
        <FadeAndSlide mountOnEnter unmountOnExit in={!editingMapping}>
          <UAVToolbar
            className={classes.toolbar}
            selectedUAVIds={selectedUAVIds}
          />
        </FadeAndSlide>
        <FadeAndSlide
          mountOnEnter
          unmountOnExit
          in={editingMapping && mappingSlotBeingEdited < 0}
        >
          <MappingEditorToolbar className={classes.toolbar} />
        </FadeAndSlide>
        <FadeAndSlide
          mountOnEnter
          unmountOnExit
          in={editingMapping && mappingSlotBeingEdited >= 0}
        >
          <MappingSlotEditorToolbar className={classes.toolbar} />
        </FadeAndSlide>
      </AppBar>
      <Box flex={1} overflow='auto'>
        <UAVListSection
          ids={mainUAVIds}
          listItemProps={listItemProps}
          label='Assigned UAVs'
          layout={layout}
          value='mainUAVIds'
          onSelect={onSelectSection}
          {...selectionInfo.mainUAVIds}
        />
        <UAVListSection
          ids={spareUAVIds}
          listItemProps={listItemProps}
          label='Spare UAVs'
          layout={layout}
          value='spareUAVIds'
          forceVisible={editingMapping}
          onSelect={onSelectSection}
          {...selectionInfo.spareUAVIds}
        />
      </Box>
      {extraSlots.length > 0 ? (
        <Box className='bottom-bar'>
          <Box display='flex' flexDirection='row' flexWrap='wrap'>
            {createGridItems(extraSlots, listItemProps)}
          </Box>
        </Box>
      ) : null}
    </Box>
  );

  return editingMapping ? (
    <DndProvider backend={HTML5Backend}>{mainBox}</DndProvider>
  ) : (
    mainBox
  );
};

UAVListPresentation.propTypes = {
  editingMapping: PropTypes.bool,
  mappingSlotBeingEdited: PropTypes.number,
  layout: PropTypes.oneOf(['list', 'grid']),
  onEditMappingSlot: PropTypes.func,
  onMappingAdjusted: PropTypes.func,
  onSelectionChanged: PropTypes.func,
  onSelectSection: PropTypes.func,
  selectedUAVIds: PropTypes.array,
  selectionInfo: PropTypes.exact({
    mainUAVIds: PropTypes.exact({
      checked: PropTypes.bool,
      disabled: PropTypes.bool,
      indeterminate: PropTypes.bool,
    }),
    spareUAVIds: PropTypes.exact({
      checked: PropTypes.bool,
      disabled: PropTypes.bool,
      indeterminate: PropTypes.bool,
    }),
    extraSlots: PropTypes.exact({
      checked: PropTypes.bool,
      disabled: PropTypes.bool,
      indeterminate: PropTypes.bool,
    }),
  }),
  uavIds: PropTypes.exact({
    mainUAVIds: PropTypes.arrayOf(PropTypes.array).isRequired,
    spareUAVIds: PropTypes.arrayOf(PropTypes.array).isRequired,
    extraSlots: PropTypes.arrayOf(PropTypes.array).isRequired,
  }).isRequired,
};

/**
 * Smart component for showing the drone show configuration view.
 */
const UAVList = connect(
  // mapStateToProps
  (state) => ({
    editingMapping: isMappingEditable(state),
    mappingSlotBeingEdited: getIndexOfMappingSlotBeingEdited(state),
    layout: getUAVListLayout(state),
    selectedUAVIds: getSelectedUAVIds(state),
    selectionInfo: getSelectionInfo(state),
    uavIds: getDisplayedIdList(state),
  }),
  // mapDispatchToProps
  {
    onEditMappingSlot: startMappingEditorSessionAtSlot,
    onMappingAdjusted: adjustMissionMapping,
    onSelectionChanged: setSelectedUAVIds,
    onSelectSection: (event) => (dispatch, getState) => {
      const { value } = event.target;
      const displayedIdsAndLabels = getDisplayedIdList(getState())[value];
      const selectedUAVIds = getSelectedUAVIds(getState());
      const selectionInfo = getSelectionInfo(getState())[value];

      if (selectionInfo && displayedIdsAndLabels) {
        const displayedIds = displayedIdsAndLabels.reduce((acc, idAndLabel) => {
          if (!isNil(idAndLabel[0])) {
            acc.push(idAndLabel[0]);
          }

          return acc;
        }, []);
        const newSelection = selectionInfo.checked
          ? difference(selectedUAVIds, displayedIds)
          : union(selectedUAVIds, displayedIds);
        dispatch(setSelectedUAVIds(newSelection));
      }
    },
  }
)(UAVListPresentation);

export default UAVList;

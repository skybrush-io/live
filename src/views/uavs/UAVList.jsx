/**
 * @file Component that displays the status of the known UAVs in a Skybrush
 * flock.
 */

import difference from 'lodash-es/difference';
import isNil from 'lodash-es/isNil';
import union from 'lodash-es/union';
import PropTypes from 'prop-types';
import React, { useCallback } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { connect } from 'react-redux';

import AppBar from '@material-ui/core/AppBar';
import Box from '@material-ui/core/Box';
import makeStyles from '@material-ui/core/styles/makeStyles';

import DroneListItem from './DroneListItem';
import DroneStatusLine from './DroneStatusLine';
import MappingEditorToolbar from './MappingEditorToolbar';
import MappingSlotEditorForGrid from './MappingSlotEditorForGrid';
import MappingSlotEditorForList from './MappingSlotEditorForList';
import MappingSlotEditorToolbar from './MappingSlotEditorToolbar';
import UAVListSubheader from './UAVListSubheader';
import UAVToolbar from './UAVToolbar';

import { setSelectedUAVIds } from '~/actions/map';
import { createSelectionHandlerThunk } from '~/components/helpers/lists';
import FadeAndSlide from '~/components/transitions/FadeAndSlide';
import DroneAvatar from '~/components/uavs/DroneAvatar';
import DronePlaceholder from '~/components/uavs/DronePlaceholder';
import {
  adjustMissionMapping,
  startMappingEditorSessionAtSlot,
} from '~/features/mission/slice';
import {
  getIndexOfMappingSlotBeingEdited,
  isMappingEditable,
} from '~/features/mission/selectors';
import {
  getUAVListLayout,
  isShowingMissionIds,
} from '~/features/settings/selectors';
import { openUAVDetailsDialog } from '~/features/uavs/details';
import { getSelectedUAVIds } from '~/selectors/selection';
import { isDark, monospacedFont } from '~/theme';
import { formatMissionId } from '~/utils/formatting';

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

    header: {
      backdropFilter: 'blur(5px)',
      background: isDark(theme)
        ? 'rgba(36, 36, 36, 0.54)'
        : 'rgba(255, 255, 255, 0.8)',
      borderBottom: `1px solid ${theme.palette.divider}`,
      fontFamily: monospacedFont,
      fontSize: 'small',
      lineHeight: '20px',
      overflow: 'hidden',
      padding: theme.spacing(0.5, 0),
      position: 'sticky',
      top: 0,
      whiteSpace: 'pre',
      zIndex: 10,
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
  {
    draggable,
    isInEditMode,
    mappingSlotBeingEdited,
    onDropped,
    onSelected,
    selectedUAVIds,
    showMissionIds,
  }
) =>
  items.map((item) => {
    const [uavId, missionIndex, proposedLabel] = item;
    const editingThisItem =
      mappingSlotBeingEdited !== undefined &&
      missionIndex === mappingSlotBeingEdited;
    const selected = selectedUAVIds.includes(uavId);
    const listItemProps = {
      onClick: onSelected
        ? (event) => onSelected(event, uavId, missionIndex)
        : undefined,
      onDrop: onDropped ? onDropped(missionIndex) : undefined,
      editing: editingThisItem,
      selected,
    };

    if (item === deletionMarker) {
      listItemProps.fill = true;
    }

    // Derive the label of the grid item. The rules are:
    //
    // - if we have a proposed label, use that
    // - if we are not showing mission IDs, use the UAV ID
    // - if we are showing mission IDs and we are not edit mode, format the
    //   mission ID nicely and show that -- unless we don't have a mission ID
    //   (we are in a spare slot), in which case use the UAV ID
    // - if we are editing the mission mapping, show the UAV ID because that's
    //   what we are going to allow the user to modify

    const label =
      proposedLabel ||
      (showMissionIds
        ? missionIndex !== undefined && (!isInEditMode || uavId === undefined)
          ? formatMissionId(missionIndex)
          : uavId
        : uavId);

    const key = uavId === undefined ? `placeholder-${label || 'null'}` : uavId;

    return uavId === undefined ? (
      <DroneListItem
        key={key}
        onDrop={onDropped ? onDropped(missionIndex) : undefined}
        {...listItemProps}
      >
        {editingThisItem && <MappingSlotEditorForGrid />}
        <DronePlaceholder
          editing={editingThisItem}
          label={editingThisItem ? '' : label}
          status={missionIndex === undefined ? 'error' : 'off'}
        />
      </DroneListItem>
    ) : (
      <DroneListItem
        key={key}
        draggable={draggable}
        uavId={uavId}
        {...listItemProps}
      >
        {editingThisItem && <MappingSlotEditorForGrid />}
        <DroneAvatar
          id={uavId}
          editing={editingThisItem}
          label={editingThisItem ? '' : label}
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
  {
    isInEditMode,
    mappingSlotBeingEdited,
    onDropped,
    onSelected,
    selectedUAVIds,
    showMissionIds,
  }
) =>
  items.map((item) => {
    if (item === deletionMarker) {
      return null;
    }

    const [uavId, missionIndex, proposedLabel] = item;
    const editingThisItem =
      isInEditMode && missionIndex === mappingSlotBeingEdited;
    const selected = selectedUAVIds.includes(uavId);
    const listItemProps = {
      onClick: onSelected
        ? (event) => onSelected(event, uavId, missionIndex)
        : undefined,
      onDrop: onDropped ? onDropped(missionIndex) : undefined,
      editing: editingThisItem,
      selected: isInEditMode ? editingThisItem : selected,
    };

    const label =
      proposedLabel ||
      (showMissionIds
        ? missionIndex !== undefined
          ? formatMissionId(missionIndex)
          : uavId
        : uavId);
    const key = uavId === undefined ? `placeholder-${label || 'null'}` : uavId;

    return (
      <DroneListItem key={key} stretch {...listItemProps}>
        {editingThisItem && <MappingSlotEditorForList />}
        <DroneStatusLine id={uavId} editing={editingThisItem} label={label} />
      </DroneListItem>
    );
  });

const UAVListSection = ({
  forceVisible,
  ids,
  itemFactory,
  itemFactoryOptions,
  layout,
  ...rest
}) => {
  const classes = useListSectionStyles();

  if (ids.length <= 0 && !forceVisible) {
    return null;
  }

  return (
    <>
      <UAVListSubheader {...rest} />
      <Box className={layout === 'grid' ? classes.grid : classes.list}>
        {itemFactory(ids, itemFactoryOptions)}
      </Box>
    </>
  );
};

UAVListSection.propTypes = {
  forceVisible: PropTypes.bool,
  ids: PropTypes.array,
  itemFactory: PropTypes.func,
  itemFactoryOptions: PropTypes.object,
  layout: PropTypes.oneOf(['grid', 'list']),
};

const HEADER_TEXT = {
  missionIds:
    ' sID  ID   Status    Mode  Battery   GPS  Position                   AMSL    AGL Hdg  Details',
  droneIds:
    '  ID       Status    Mode  Battery   GPS  Position                   AMSL    AGL Hdg  Details',
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
  onSelectItem,
  onSelectSection,
  selectedUAVIds,
  selectionInfo,
  showMissionIds,
  uavIds,
}) => {
  const classes = useListStyles();

  const onDropped = useCallback(
    (targetIndex) => (droppedUAVId) =>
      onMappingAdjusted({
        uavId: droppedUAVId,
        to: targetIndex,
      }),
    [onMappingAdjusted]
  );

  const onStartEditing = useCallback(
    (_event, _uavId, missionIndex) => onEditMappingSlot(missionIndex),
    [onEditMappingSlot]
  );

  const { mainUAVIds, spareUAVIds, extraSlots } = uavIds;

  const itemFactory = layout === 'grid' ? createGridItems : createListItems;

  const itemFactoryOptions = {
    draggable: editingMapping,
    isInEditMode: editingMapping,
    mappingSlotBeingEdited,
    onDropped: editingMapping && onDropped,
    onSelected: editingMapping ? onStartEditing : onSelectItem,
    selectedUAVIds,
    showMissionIds,
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
        {layout === 'list' && (
          <div className={classes.header}>
            {showMissionIds ? HEADER_TEXT.missionIds : HEADER_TEXT.droneIds}
          </div>
        )}
        <UAVListSection
          ids={mainUAVIds}
          itemFactory={itemFactory}
          itemFactoryOptions={itemFactoryOptions}
          label={showMissionIds ? 'Assigned UAVs' : 'All UAVs'}
          layout={layout}
          value='mainUAVIds'
          onSelect={onSelectSection}
          {...selectionInfo.mainUAVIds}
        />
        <UAVListSection
          ids={spareUAVIds}
          itemFactory={itemFactory}
          itemFactoryOptions={itemFactoryOptions}
          label='Spare UAVs'
          layout={layout}
          value='spareUAVIds'
          forceVisible={editingMapping}
          onSelect={onSelectSection}
          {...selectionInfo.spareUAVIds}
        />
      </Box>
      {extraSlots.length > 0 && layout === 'grid' ? (
        <Box className='bottom-bar'>
          <Box display='flex' flexDirection='row' flexWrap='wrap'>
            {createGridItems(extraSlots, itemFactoryOptions)}
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
  onSelectItem: PropTypes.func,
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
  showMissionIds: PropTypes.bool,
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
    showMissionIds: isShowingMissionIds(state),
    uavIds: getDisplayedIdList(state),
  }),
  // mapDispatchToProps
  {
    onEditMappingSlot: startMappingEditorSessionAtSlot,
    onMappingAdjusted: adjustMissionMapping,
    onSelectItem: createSelectionHandlerThunk({
      activateItem: openUAVDetailsDialog,
      getSelection: getSelectedUAVIds,
      setSelection: setSelectedUAVIds,
    }),
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

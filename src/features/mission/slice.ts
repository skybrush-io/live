/**
 * @file Slice of the state object that handles the state of the current
 * mission, i.e. a set of trajectories and commands that a group of UAVs must
 * perform, as well as a mapping from the mission-specific identifiers of
 * the UAVs to the real, physicaly identifiers of the UAVs that participate
 * in the mission.
 */

import isNil from 'lodash-es/isNil';
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { type ReadonlyDeep } from 'type-fest';

import { removeFeaturesByIds } from '~/features/map-features/slice';
import { type FeatureProperties } from '~/features/map-features/types';
import { GeofenceAction } from '~/features/safety/model';
import { type MissionItem, MissionType } from '~/model/missions';
import { type GPSPosition } from '~/model/position';
import type UAV from '~/model/uav';
import {
  type Collection,
  addItemAt,
  addItemToBack,
  deleteItemsByIds,
} from '~/utils/collections';
import { noPayload } from '~/utils/redux';
import { type Nullable } from '~/utils/types';

import {
  copyAndEnsureLengthEquals,
  getNewEditIndex,
  type MissionMappingEditorContinuation,
} from './utils';

/**
 * Type definition for the mission slice of the state object.
 *
 * NOTE: For the sake of consistency we refrain from using `undefined` as the
 *       _"empty"_ element of arrays that are stored in the state, as those
 *       would get serialized to `null`, and while the two values should rarely
 *       be distinguished, this still seems like the safer approach.
 */
export type MissionSliceState = ReadonlyDeep<{
  /**
   * Type of the mission; ``show`` for drone shows. Empty string means that
   * there is no mission yet.
   */
  type: MissionType;

  /**
   * Stores a mapping from the mission-specific consecutive identifiers
   * to the IDs of the UAVs that participate in the mission with that
   * mission-specific identifier. The mapping may store UAV IDs and
   * null values for identifiers where the corresponding physical UAV
   * is not assigned yet.
   *
   * @see The `NOTE` at `MissionSliceState`
   */
  mapping: Array<Nullable<UAV['id']>>;

  /**
   * Stores the desired home position (starting point) of each drone
   * in the mission, in GPS coordinates. The array is indexed by
   * mission-specific identifiers.
   *
   * @see The `NOTE` at `MissionSliceState`
   */
  homePositions: Array<Nullable<GPSPosition>>;

  /**
   * Stores the desired landing position of each drone in the mission, in
   * GPS coordinates. The array is indexed by mission-specific identifiers.
   *
   * @see The `NOTE` at `MissionSliceState`
   */
  landingPositions: Array<Nullable<GPSPosition>>;

  /**
   * Stores the takeoff headings of each drone in the mission. The array is
   * indexed by mission-specific identifiers.
   *
   * @see The `NOTE` at `MissionSliceState`
   */
  takeoffHeadings: Array<Nullable<number>>;

  /** Stores the state of the mapping editor */
  mappingEditor: {
    /** Stores whether the mapping is currently being edited on the UI */
    enabled: boolean;

    /**
     * Stores the index of the slot in the mapping that is being edited;
     * -1 if no slot is being edited
     */
    indexBeingEdited: number;
  };

  /**
   * Whether we prefer the primary or the secondary telemetry channel for
   * communication
   */
  preferredChannelIndex: number;

  /**
   * Whether we are allowed to broadcast commands from the large flight
   * control panel to all UAVs
   */
  commandsAreBroadcast: boolean;

  /** ID of the polygon that holds the current geofence */
  geofencePolygonId?: FeatureProperties['id'];

  /** Action to perform when the geofence is breached */
  geofenceAction: GeofenceAction;

  /** Collection of items in the current mission if it is a waypoint-based mission */
  items: Collection<MissionItem>;

  /** State of the mission editor panel */
  editorPanel: {
    followScroll: boolean;
  };

  /** State of the mission planner dialog */
  plannerDialog: {
    applyGeofence: boolean;
    open: boolean;
    parameters: {
      fromUser: Record<string, any>;
      fromContext: Record<string, any>;
    };
    selectedType: Nullable<string>;
  };

  /** Parameters used in the last successful invocation of the mission planner */
  lastSuccessfulPlannerInvocationParameters: Nullable<{
    type: string;
    parametersFromUser: Record<string, any>;
    valuesFromContext: Record<string, any>;
  }>;

  /** The progress of the mission as reported by the UAV */
  progress: {
    currentItemId?: string;
    currentItemRatio?: number;
  };

  /** Backup of the last cleared mission */
  lastClearedMissionData: Nullable<Record<string, any>>;
}>;

const initialState: MissionSliceState = {
  type: MissionType.UNKNOWN,
  mapping: [],
  homePositions: [],
  landingPositions: [],
  takeoffHeadings: [],
  mappingEditor: {
    enabled: false,
    indexBeingEdited: -1,
  },
  preferredChannelIndex: 0,
  commandsAreBroadcast: false,
  geofencePolygonId: undefined,
  geofenceAction: GeofenceAction.RETURN,
  items: {
    byId: {},
    order: [],
  },
  editorPanel: {
    followScroll: false,
  },
  plannerDialog: {
    applyGeofence: false,
    open: false,
    parameters: {
      fromUser: {},
      fromContext: {},
    },
    selectedType: null,
  },
  lastSuccessfulPlannerInvocationParameters: null,
  progress: {
    currentItemId: undefined,
    currentItemRatio: undefined,
  },
  lastClearedMissionData: null,
};

const { actions, reducer } = createSlice({
  name: 'mission',
  initialState,
  reducers: {
    addMissionItem(
      state,
      action: PayloadAction<{ item: MissionItem; index: number }>
    ) {
      const { item, index } = action.payload;
      const { id, type } = item;

      if (!id) {
        throw new Error('Mission item must have an ID');
      }

      if (!type) {
        throw new Error('Mission item must have a type');
      }

      if (state.items.byId[id]) {
        throw new Error('Mission item ID is already taken');
      }

      // Update the state
      if (typeof index === 'number') {
        addItemAt(state.items, item, index);
      } else {
        addItemToBack(state.items, item);
      }
    },

    adjustMissionMapping(
      state,
      action: PayloadAction<{ uavId: UAV['id']; to: number }>
    ) {
      const { uavId, to } = action.payload;
      const from = state.mapping.indexOf(uavId);
      const uavIdToReplace = isNil(to) ? null : state.mapping[to];

      if (from >= 0) {
        state.mapping[from] = uavIdToReplace ?? null;
      }

      if (!isNil(to)) {
        state.mapping[to] = uavId;
      }
    },

    /**
     * Cancels the current editing session of the mapping at the current slot.
     */
    cancelMappingEditorSessionAtCurrentSlot: noPayload<MissionSliceState>(
      (state) => {
        state.mappingEditor.indexBeingEdited = -1;
      }
    ),

    /**
     * Clears the id determining the polygon that is to be used as a geofence.
     */
    clearGeofencePolygonId: noPayload<MissionSliceState>((state) => {
      state.geofencePolygonId = undefined;
    }),

    /**
     * Clears the entire mission mapping.
     */
    clearMapping(state) {
      state.mapping = Array.from({ length: state.mapping.length }, () => null);
    },

    /**
     * Clears a single slot in the mission mapping.
     */
    clearMappingSlot(state, action: PayloadAction<number>) {
      const index = action.payload;
      if (index >= 0 && index < state.mapping.length) {
        state.mapping[index] = null;
      }
    },

    /**
     * Closes the mission planner dialog.
     */
    closeMissionPlannerDialog: noPayload<MissionSliceState>((state) => {
      state.plannerDialog.open = false;
    }),

    /**
     * Finishes the current editing session of the mapping.
     */
    finishMappingEditorSession: noPayload<MissionSliceState>((state) => {
      state.mappingEditor.enabled = false;
      state.mappingEditor.indexBeingEdited = -1;
    }),

    /**
     * Commits the new value in the mapping editor to the current slot being
     * edited, and optionally continues with the next slot.
     */
    commitMappingEditorSessionAtCurrentSlot(
      state,
      action: PayloadAction<{
        continuation: MissionMappingEditorContinuation;
        value: string;
      }>
    ) {
      const { continuation, value } = action.payload;
      const validatedValue =
        typeof value === 'string' && value.trim().length > 0 ? value : null;
      const index = state.mappingEditor.indexBeingEdited;

      if (index >= 0 && index < state.mapping.length) {
        const oldValue = state.mapping[index];
        const existingIndex =
          validatedValue === null ? -1 : state.mapping.indexOf(validatedValue);

        // Prevent duplicates: if the value being entered already exists
        // elsewhere in the mapping, swap it with the old value of the
        // slot being edited.
        if (existingIndex >= 0) {
          state.mapping[existingIndex] = oldValue ?? null;
        }

        state.mapping[index] = validatedValue;
      }

      state.mappingEditor.indexBeingEdited = getNewEditIndex(
        state,
        continuation
      );
    },

    moveMissionItem: {
      prepare: (oldIndex: number, newIndex: number) => ({
        payload: { oldIndex, newIndex },
      }),
      reducer(
        state,
        action: PayloadAction<{ oldIndex: number; newIndex: number }>
      ) {
        const { oldIndex, newIndex } = action.payload;
        const numItems = state.items.order.length;
        if (
          oldIndex >= 0 &&
          oldIndex < numItems &&
          newIndex >= 0 &&
          newIndex < numItems &&
          oldIndex !== newIndex
        ) {
          const [itemId] = state.items.order.splice(oldIndex, 1);
          state.items.order.splice(newIndex, 0, itemId!);
        }
      },
    },

    removeMissionItemsByIds(
      state,
      action: PayloadAction<Array<MissionItem['id']>>
    ) {
      deleteItemsByIds(state.items, action.payload);
    },

    /**
     * Removes some UAVs from the mission mapping.
     */
    removeUAVsFromMapping(state, action: PayloadAction<Array<UAV['id']>>) {
      for (const uavId of action.payload) {
        const index = state.mapping.indexOf(uavId);
        if (index >= 0) {
          state.mapping[index] = null;
        }
      }
    },

    /**
     * Replaces the entire mission mapping with a new one.
     */
    replaceMapping(state, action: PayloadAction<Array<Nullable<UAV['id']>>>) {
      const newMapping = action.payload;

      if (!Array.isArray(newMapping)) {
        throw new TypeError('New mapping must be an array');
      }

      if (newMapping.length !== state.mapping.length) {
        throw new Error('Cannot change mapping length with replaceMapping()');
      }

      state.mapping = newMapping;
    },

    /**
     * Sets whether we are broadcasting all flight commands from the show control
     * panel to all UAVs if possible.
     */
    setCommandsAreBroadcast(state, action: PayloadAction<boolean>) {
      state.commandsAreBroadcast = Boolean(action.payload);
    },

    /**
     * Sets whether the mission editor panel should follow the active item.
     */
    setEditorPanelFollowScroll(state, action: PayloadAction<boolean>) {
      state.editorPanel.followScroll = Boolean(action.payload);
    },

    /**
     * Sets the action to perform when the geofence is breached.
     */
    setGeofenceAction(state, action: PayloadAction<GeofenceAction>) {
      state.geofenceAction = action.payload;
    },

    /**
     * Sets the ID determining the polygon that is to be used as a geofence.
     */
    setGeofencePolygonId(
      state,
      action: PayloadAction<FeatureProperties['id']>
    ) {
      state.geofencePolygonId = action.payload;
    },

    /**
     * Sets the length of the mapping. When the new length is smaller than the
     * old length, the mapping will be truncated from the end. When the new
     * length is larger than the old length, empty slots will be added to the
     * end of the mapping.
     */
    setMappingLength(state, action: PayloadAction<string | number>) {
      // TODO: Remove the string case.
      const desiredLength =
        typeof action.payload === 'string'
          ? Number.parseInt(action.payload, 10)
          : action.payload;

      if (
        Number.isNaN(desiredLength) ||
        desiredLength < 0 ||
        desiredLength > 1000
      ) {
        return;
      }

      const currentLength = state.mapping.length;

      if (desiredLength < currentLength) {
        state.mapping.splice(desiredLength);
        state.homePositions.splice(desiredLength);
        state.landingPositions.splice(desiredLength);
        state.takeoffHeadings.splice(desiredLength);
      } else if (desiredLength > currentLength) {
        const padding = Array.from(
          { length: desiredLength - currentLength },
          () => null
        );

        state.mapping.push(...padding);
        state.homePositions.push(...padding);
        state.landingPositions.push(...padding);
        state.takeoffHeadings.push(...padding);
      }
    },

    /**
     * Sets the array of items in the mission, assuming that all items are
     * already validated.
     */
    _setMissionItemsFromValidatedArray(
      state,
      { payload: items }: PayloadAction<MissionItem[]>
    ) {
      state.items = {
        order: items.map((i) => i.id),
        byId: Object.fromEntries(items.map((i) => [i.id, i])),
      };
      state.progress = {
        currentItemId: undefined,
        currentItemRatio: undefined,
      };
    },

    /**
     * Sets the type of the mission, without affecting any other part of the
     * current mission configuration.
     */
    setMissionType(state, action: PayloadAction<MissionType>) {
      state.type =
        typeof action.payload === 'string'
          ? action.payload
          : MissionType.UNKNOWN;
    },

    setMissionPlannerDialogApplyGeofence(
      state,
      action: PayloadAction<boolean>
    ) {
      state.plannerDialog.applyGeofence = Boolean(action.payload);
    },

    setMissionPlannerDialogSelectedType(
      state,
      action: PayloadAction<Nullable<string>>
    ) {
      state.plannerDialog.selectedType = action.payload;
    },

    setMissionPlannerDialogContextParametersAsMap: {
      // Convert the Map to an object to avoid issues with serialization.
      prepare: (fromContext: Map<string, any>) => ({
        payload: Object.fromEntries(fromContext.entries()),
      }),
      reducer(state, action: PayloadAction<Record<string, any>>) {
        state.plannerDialog.parameters.fromContext = action.payload;
      },
    },

    setMissionPlannerDialogContextParametersAsObject(
      state,
      action: PayloadAction<Record<string, any>>
    ) {
      state.plannerDialog.parameters.fromContext = action.payload;
    },

    setMissionPlannerDialogUserParameters(
      state,
      action: PayloadAction<Record<string, any>>
    ) {
      state.plannerDialog.parameters.fromUser = action.payload;
    },

    setLastSuccessfulPlannerInvocationParameters(
      state,
      action: PayloadAction<
        MissionSliceState['lastSuccessfulPlannerInvocationParameters']
      >
    ) {
      state.lastSuccessfulPlannerInvocationParameters = action.payload;
    },

    setLastClearedMissionData(
      state,
      action: PayloadAction<MissionSliceState['lastClearedMissionData']>
    ) {
      state.lastClearedMissionData = action.payload;
    },

    /**
     * Shows the mission planner dialog.
     */
    showMissionPlannerDialog: noPayload<MissionSliceState>((state) => {
      state.plannerDialog.open = true;
    }),

    /**
     * Starts the current editing session of the mapping, and marks the
     * given slot in the mapping as the one being edited.
     */
    startMappingEditorSessionAtSlot(state, action: PayloadAction<number>) {
      const tentativeIndex =
        typeof action.payload === 'number' ? action.payload : -1;
      const index =
        tentativeIndex < 0 || tentativeIndex >= state.mapping.length
          ? -1
          : tentativeIndex;

      state.mappingEditor.enabled = true;
      state.mappingEditor.indexBeingEdited = index;
    },

    /**
     * Starts the current editing session of the mapping.
     */
    startMappingEditorSession: noPayload<MissionSliceState>((state) => {
      state.mappingEditor.enabled = true;
      state.mappingEditor.indexBeingEdited = -1;
    }),

    /**
     * Toggles the preferred communication channel for outbound commands
     * from primary to secondary or vice versa
     */
    togglePreferredChannel(state) {
      state.preferredChannelIndex = state.preferredChannelIndex ? 0 : 1;
    },

    /**
     * Updates the ID of the mission item that's currently being executed.
     */
    updateCurrentMissionItemId(state, action: PayloadAction<string>) {
      state.progress.currentItemId = action.payload;

      // Reset the progress to clear remaining data from the previous item.
      state.progress.currentItemRatio = undefined;
    },

    /**
     * Updates the progress ratio of the mission item that's currently being
     * executed.
     */
    updateCurrentMissionItemRatio(state, action: PayloadAction<number>) {
      state.progress.currentItemRatio = action.payload;
    },

    /**
     * Updates the home positions of all the drones in the mission.
     */
    updateHomePositions(
      state,
      action: PayloadAction<Array<Nullable<GPSPosition>>>
    ) {
      state.homePositions = copyAndEnsureLengthEquals(
        state.mapping.length,
        action.payload
      );
    },

    /**
     * Updates the landing positions of all the drones in the mission.
     */
    updateLandingPositions(
      state,
      action: PayloadAction<Array<Nullable<GPSPosition>>>
    ) {
      state.landingPositions = copyAndEnsureLengthEquals(
        state.mapping.length,
        action.payload
      );
    },

    /**
     * Updates the properties of a mission item in a waypoint-based mission.
     */
    updateMissionItemParameters: {
      prepare: (
        itemId: MissionItem['id'],
        parameters: MissionItem['parameters']
      ) => ({ payload: { itemId, parameters } }),
      reducer(
        state,
        action: PayloadAction<{
          itemId: MissionItem['id'];
          parameters: MissionItem['parameters'];
        }>
      ) {
        const { itemId, parameters } = action.payload;
        const item = state.items.byId[itemId];
        if (item) {
          item.parameters = { ...item.parameters, ...parameters };
        }
      },
    },

    /**
     * Updates the takeoff headings of all the drones in the mission.
     */
    updateTakeoffHeadings(
      state,
      { payload }: PayloadAction<number[] | number>
    ) {
      if (Array.isArray(payload)) {
        state.takeoffHeadings = copyAndEnsureLengthEquals(
          state.mapping.length,
          payload
        );
      } else {
        state.takeoffHeadings = Array.from(
          { length: state.mapping.length },
          () => payload
        );
      }
    },
  },

  extraReducers(builder) {
    builder.addCase(removeFeaturesByIds, (state, action) => {
      const ids = action.payload;
      if (state.geofencePolygonId && ids.includes(state.geofencePolygonId)) {
        state.geofencePolygonId = undefined;
      }
    });
  },
});

export const {
  addMissionItem,
  adjustMissionMapping,
  cancelMappingEditorSessionAtCurrentSlot,
  clearGeofencePolygonId,
  clearMapping,
  clearMappingSlot,
  closeMissionPlannerDialog,
  commitMappingEditorSessionAtCurrentSlot,
  finishMappingEditorSession,
  moveMissionItem,
  removeMissionItemsByIds,
  removeUAVsFromMapping,
  replaceMapping,
  setCommandsAreBroadcast,
  setEditorPanelFollowScroll,
  setGeofenceAction,
  setGeofencePolygonId,
  setLastClearedMissionData,
  setLastSuccessfulPlannerInvocationParameters,
  setMappingLength,
  setMissionPlannerDialogApplyGeofence,
  setMissionPlannerDialogContextParametersAsMap,
  setMissionPlannerDialogContextParametersAsObject,
  setMissionPlannerDialogSelectedType,
  setMissionPlannerDialogUserParameters,
  setMissionType,
  showMissionPlannerDialog,
  startMappingEditorSession,
  startMappingEditorSessionAtSlot,
  togglePreferredChannel,
  updateCurrentMissionItemId,
  updateCurrentMissionItemRatio,
  updateHomePositions,
  updateLandingPositions,
  updateMissionItemParameters,
  updateTakeoffHeadings,
  _setMissionItemsFromValidatedArray,
} = actions;

export default reducer;

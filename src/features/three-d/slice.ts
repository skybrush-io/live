/**
 * @file Slice of the state object that stores the state of the 3D view.
 */

import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { type Vector3Tuple } from 'three';

import { type EulerTuple, NavigationMode, ThreeDInteractionMode } from './types';

type ThreeDSliceState = {
  camera: {
    position?: Vector3Tuple;
    rotation?: EulerTuple;
  };

  navigation: {
    mode: NavigationMode;
    // TODO: Probably unused, verify this when it can be typechecked!
    parameters: Record<string, unknown>;
  };

  interactionMode: ThreeDInteractionMode;

  tooltip?: string;

  sceneId: number;

  viewRuntime: {
    droneConfig: unknown | null;
    pathProgress: number;
    formationPhases: unknown[];
    formationSettings: Record<string, unknown>;
  };
};

const initialState: ThreeDSliceState = {
  camera: {
    position: undefined,
    rotation: undefined,
  },

  navigation: {
    mode: NavigationMode.WALK,
    parameters: {},
  },

  interactionMode: ThreeDInteractionMode.VIEW,

  tooltip: undefined,

  sceneId: 0,

  viewRuntime: {
    droneConfig: null,
    pathProgress: 0,
    formationPhases: [],
    formationSettings: {
      step_size: 1.0,
      duration_ms: 1000,
      takeoff_time: 0,
      auto_upload: false,
      output: '',
    },
  },
};

const { actions, reducer } = createSlice({
  name: 'three-d',
  initialState,
  reducers: {
    notifySceneRemoval(state) {
      // increase sceneInstance by 1 -- this is used to force a re-mounting
      // of <a-scene>. This is needed because otherwise the 3D view would crash
      // when it is re-parented in the workbench, which could happen in
      // multiple cases (e.g., when a panel is dropped below the 3D view,
      // creating a new vertical stack). When the 3D view is reparented, all
      // A-Frame-related tags are removed and then re-inserted into the DOM,
      // which confuses the underlying renderer.
      state.sceneId++;
    },

    resetZoom() {
      // Resets the zoom level of the 3D view.
      // Nothing to do here, the saga will handle this action.
    },

    rotateViewTowards() {
      // Rotates the 3D view towards the target given in the action payload.
      // Nothing to do here, the saga will handle this action.
    },

    setCameraPose(
      state,
      action: PayloadAction<{ position: Vector3Tuple; rotation: EulerTuple }>
    ) {
      const { position, rotation } = action.payload;
      state.camera.position = position;
      state.camera.rotation = rotation;
    },

    setInteractionMode(state, action: PayloadAction<ThreeDInteractionMode>) {
      const mode = action.payload;
      if (
        mode === ThreeDInteractionMode.VIEW ||
        mode === ThreeDInteractionMode.CREATE
      ) {
        state.interactionMode = mode;
      }
    },

    setNavigationMode(
      state,
      action: PayloadAction<
        | NavigationMode
        | { mode: NavigationMode; parameters: Record<string, unknown> }
      >
    ) {
      const { payload } = action;

      if (typeof payload === 'string') {
        state.navigation.mode = payload;
        state.navigation.parameters = {};
      } else {
        const { mode, parameters } = payload;

        if (typeof mode === 'string' && typeof parameters === 'object') {
          state.navigation.mode = mode;
          state.navigation.parameters = parameters;
        }
      }
    },

    showTooltip(state, action: PayloadAction<string | undefined>) {
      state.tooltip = action.payload ? String(action.payload) : undefined;
    },

    hideTooltip(state) {
      state.tooltip = undefined;
    },

    setViewRuntimeState(
      state,
      action: PayloadAction<{
        droneConfig: unknown | null;
        pathProgress: number;
        formationPhases?: unknown[];
        formationSettings?: Record<string, unknown>;
      }>
    ) {
      const { droneConfig, pathProgress, formationPhases, formationSettings } =
        action.payload ?? {};
      const normalizedProgress = Number(pathProgress);

      state.viewRuntime.droneConfig = droneConfig ?? null;
      state.viewRuntime.pathProgress = Number.isFinite(normalizedProgress)
        ? Math.min(100, Math.max(0, normalizedProgress))
        : 0;

      if (Array.isArray(formationPhases)) {
        state.viewRuntime.formationPhases = formationPhases;
      }
      if (
        formationSettings != null &&
        typeof formationSettings === 'object' &&
        !Array.isArray(formationSettings)
      ) {
        state.viewRuntime.formationSettings = formationSettings;
      }
    },
  },
});

export const {
  hideTooltip,
  notifySceneRemoval,
  resetZoom,
  rotateViewTowards,
  setCameraPose,
  setInteractionMode,
  setNavigationMode,
  setViewRuntimeState,
  showTooltip,
} = actions;

export default reducer;

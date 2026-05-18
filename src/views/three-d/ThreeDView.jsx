/**
 * @file Component that shows a three-dimensional view of the drone flock.
 */

import PropTypes from 'prop-types';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { connect } from 'react-redux';
import { createSelector } from '@reduxjs/toolkit';
import SunCalc from 'suncalc';

import CoordinateSystemAxes from './CoordinateSystemAxes';
import DroneShapeMarkers from './DroneShapeMarkers';
import DronePathTrajectories from './DronePathTrajectories';
import HomePositionMarkers from './HomePositionMarkers';
import LandingPositionMarkers from './LandingPositionMarkers';
import Room from './Room';
import SatelliteMapGround from './SatelliteMapGround';
import Scenery from './Scenery';
import SelectedTrajectories from './SelectedTrajectories';
import DroneInfoPanel from './DroneInfoPanel';
import DroneStatusOverlay from './DroneStatusOverlay';
import PathControlPanel from './PathControlPanel';
import AddDroneModal from './AddDroneModal';
import PathGeneratorModal from './PathGeneratorModal';
import useThreeDViewDroneEvents from './hooks/useThreeDViewDroneEvents';
import {
  buildSeekPathWithInitial,
  collectConfigFromScene as collectConfigFromSceneUtil,
  getEffectiveScenery as getEffectiveSceneryUtil,
  getPathTotalDurationMs,
  normalizeDroneForConfigIO,
  parsePositionLike,
  slicePathByElapsedMs,
} from './utils/threeDViewUtils';

// eslint-disable-next-line no-unused-vars
import AFrame from '~/aframe';
import { objectToString } from '~/aframe/utils';
import Colors from '~/components/colors';
import {
  getLightingConditionsForThreeDView,
  getSceneryForThreeDView,
} from '~/features/settings/selectors';
import { getReverseMissionMapping } from '~/features/mission/selectors';
import { setViewRuntimeState } from '~/features/three-d/slice';
import {
  getDroneSwarmSpecification,
  getOutdoorShowToWorldCoordinateSystemTransformation,
  isShowIndoor,
} from '~/features/show/selectors';
import {
  getFlatEarthCoordinateTransformer,
  isMapCoordinateSystemLeftHanded,
} from '~/selectors/map';

const getEffectiveScenery = (state) => {
  return getEffectiveSceneryUtil(state, getSceneryForThreeDView, isShowIndoor);
};

const getNaturalLightingForThreeDView = (state) => {
  const origin = state.map.origin.position;
  if (!Array.isArray(origin)) {
    return getLightingConditionsForThreeDView(state);
  }

  const [lon, lat] = origin;
  const { altitude } = SunCalc.getPosition(new Date(), lat, lon);
  return altitude < -0.05 ? 'dark' : 'light';
};

const DEFAULT_PATH_DELIVERY_URL = '/api/v1/path-planner/plan';
const PATH_DELIVERY_PROXY_TARGET = 'http://localhost:5001/api/v1/path-planner/plan';

const DEFAULT_FORMATION_SETTINGS = Object.freeze({
  step_size: 1.0,
  duration_ms: 1000,
  takeoff_time: 0,
  auto_upload: false,
  // 빈 문자열 = 백엔드 기본값(.skyc 다운로드) 사용. payload에서 output 키를 생략.
  output: '',
});

// 첫 번째 항목('')은 "백엔드 기본값(=skyc) 사용". 그 외 값을 선택하면 명시적으로 전송.
const FORMATION_OUTPUT_OPTIONS = ['', 'path', 'show', 'skyc'];

const cssEscape = (value) => {
  const raw = String(value ?? '');
  if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') {
    return CSS.escape(raw);
  }
  return raw;
};

const roundCoord = (value) => Math.round(value * 10000) / 10000;

const readDronePositionFromDom = (droneId) => {
  if (typeof document === 'undefined' || !droneId) return null;
  const target = document.querySelector(
    `a-scene [data-drone-id="${cssEscape(droneId)}"]`
  );
  const pos = target?.getAttribute?.('position');
  if (!pos || typeof pos !== 'object') return null;
  const x = Number(pos.x);
  const y = Number(pos.y);
  const z = Number(pos.z);
  if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) {
    return null;
  }
  return { x: roundCoord(x), y: roundCoord(y), z: roundCoord(z) };
};

const readAllDronePositionsFromDom = () => {
  const result = {};
  if (typeof document === 'undefined') return result;
  const targets = document.querySelectorAll('a-scene [data-drone-id]');
  targets.forEach((el) => {
    const id = el.getAttribute('data-drone-id');
    if (!id) return;
    const pos = readDronePositionFromDom(id);
    if (pos) result[id] = pos;
  });
  return result;
};

const getDroneInitialPositionTuple = (drone) => {
  // path의 첫 점이 곧 시작 위치. 없으면 기존 initialPos/pos로 fallback.
  const firstPathPoint = Array.isArray(drone?.path) && drone.path.length > 0
    ? drone.path[0]
    : null;
  if (firstPathPoint) {
    const fx = Number(firstPathPoint.x);
    const fy = Number(firstPathPoint.y);
    const fz = Number(firstPathPoint.z);
    if (Number.isFinite(fx) && Number.isFinite(fy) && Number.isFinite(fz)) {
      return [fx, fy, fz];
    }
  }

  const initial = Array.isArray(drone?.initialPos) && drone.initialPos.length >= 3
    ? drone.initialPos
    : drone?.pos;
  if (!Array.isArray(initial) || initial.length < 3) return [0, 0, 0];
  const x = Number(initial[0]);
  const y = Number(initial[1]);
  const z = Number(initial[2]);
  return [
    Number.isFinite(x) ? x : 0,
    Number.isFinite(y) ? y : 0,
    Number.isFinite(z) ? z : 0,
  ];
};

/** 새로고침 후 복원 시: 패널의 초기 위치(initialPos)가 있으면 그것을, 없으면 기존 규칙(path 첫 점 등)을 사용 */
const getDroneHomePositionTupleForReload = (drone) => {
  if (Array.isArray(drone?.initialPos) && drone.initialPos.length >= 3) {
    const x = Number(drone.initialPos[0]);
    const y = Number(drone.initialPos[1]);
    const z = Number(drone.initialPos[2]);
    if (Number.isFinite(x) && Number.isFinite(y) && Number.isFinite(z)) {
      return [x, y, z];
    }
  }
  return getDroneInitialPositionTuple(drone);
};

const sanitizeFormationSettings = (settings) => {
  const merged = { ...DEFAULT_FORMATION_SETTINGS, ...(settings || {}) };
  const stepSize = Number(merged.step_size);
  const durationMs = Number(merged.duration_ms);
  const takeoffTime = Number(merged.takeoff_time);
  const rawOutput = merged.output == null ? '' : String(merged.output);
  const output = FORMATION_OUTPUT_OPTIONS.includes(rawOutput)
    ? rawOutput
    : DEFAULT_FORMATION_SETTINGS.output;
  return {
    step_size: Number.isFinite(stepSize) && stepSize > 0
      ? stepSize
      : DEFAULT_FORMATION_SETTINGS.step_size,
    duration_ms: Number.isFinite(durationMs) && durationMs >= 0
      ? Math.round(durationMs)
      : DEFAULT_FORMATION_SETTINGS.duration_ms,
    takeoff_time: Number.isFinite(takeoffTime) && takeoffTime >= 0
      ? takeoffTime
      : DEFAULT_FORMATION_SETTINGS.takeoff_time,
    auto_upload: !!merged.auto_upload,
    output,
  };
};

const generateImportedFormationPhaseId = (index) =>
  `phase-import-${Date.now().toString(36)}-${index}-${Math.random().toString(36).slice(2, 8)}`;

const normalizeFormationPhaseForImport = (raw, index) => {
  const id =
    raw?.id != null && String(raw.id).trim() !== ''
      ? String(raw.id)
      : generateImportedFormationPhaseId(index);
  const name = String(raw?.name ?? '').trim() || `phase-${index + 1}`;
  const holdMs = Math.max(0, Math.round(Number(raw?.holdMs) || 0));
  const points = {};
  const rawPoints = raw?.points;
  if (rawPoints && typeof rawPoints === 'object' && !Array.isArray(rawPoints)) {
    Object.entries(rawPoints).forEach(([droneId, pos]) => {
      if (droneId == null || String(droneId).trim() === '') return;
      const x = Number(pos?.x);
      const y = Number(pos?.y);
      const z = Number(pos?.z);
      if (Number.isFinite(x) && Number.isFinite(y) && Number.isFinite(z)) {
        points[String(droneId)] = { x, y, z };
      }
    });
  }
  return { id, name, holdMs, points };
};

const stripFormationFromDroneConfigRoot = (parsed) => {
  if (!parsed || typeof parsed !== 'object') return {};
  const next = { ...parsed };
  delete next.formation;
  delete next.formation_phases;
  delete next.formation_settings;
  delete next.formationPhases;
  delete next.formationSettings;
  delete next.drones;
  return next;
};

/**
 * JSON에 show-drone-N / drone-N 등 서로 다른 id 체계가 섞여 있을 때,
 * phase.points 키를 현재 불러온 drones[].id와 맞춥니다.
 */
const remapFormationPhasesToDroneIds = (phases, drones) => {
  if (!Array.isArray(phases) || !phases.length) return phases;
  if (!Array.isArray(drones) || !drones.length) return phases;
  const droneIds = drones.map((d) => String(d?.id || '')).filter(Boolean);
  const droneIdSet = new Set(droneIds);
  if (!droneIds.length) return phases;

  const trailingNumber = (s) => {
    const m = String(s).match(/(\d+)\s*$/);
    return m ? Number(m[1]) : NaN;
  };

  return phases.map((phase) => {
    const raw =
      phase.points && typeof phase.points === 'object' && !Array.isArray(phase.points)
        ? phase.points
        : {};
    const entries = Object.entries(raw);
    if (!entries.length) return phase;
    if (entries.every(([k]) => droneIdSet.has(String(k)))) return phase;

    const newPoints = {};
    entries.forEach(([k, pos], i) => {
      const key = String(k);
      if (droneIdSet.has(key)) {
        newPoints[key] = pos;
        return;
      }
      const n = trailingNumber(key);
      if (Number.isFinite(n) && n >= 1) {
        const byOrder = droneIds[n - 1];
        if (byOrder) {
          newPoints[byOrder] = pos;
          return;
        }
        const candDrone = `drone-${n}`;
        if (droneIdSet.has(candDrone)) {
          newPoints[candDrone] = pos;
          return;
        }
        const candShow = `show-drone-${n}`;
        if (droneIdSet.has(candShow)) {
          newPoints[candShow] = pos;
          return;
        }
      }
      if (droneIds.length === entries.length) {
        newPoints[droneIds[i]] = pos;
        return;
      }
      newPoints[key] = pos;
    });
    return { ...phase, points: newPoints };
  });
};

const readFormationImportFromParsed = (parsed) => {
  if (!parsed || typeof parsed !== 'object') return null;

  if (parsed.formation && typeof parsed.formation === 'object') {
    const { phases: phasesRaw, settings: settingsRaw } = parsed.formation;
    const phases = Array.isArray(phasesRaw)
      ? phasesRaw.map((p, i) => normalizeFormationPhaseForImport(p, i))
      : [];
    const settings =
      settingsRaw && typeof settingsRaw === 'object'
        ? sanitizeFormationSettings(settingsRaw)
        : DEFAULT_FORMATION_SETTINGS;
    return { phases, settings };
  }

  if (
    Array.isArray(parsed.formationPhases) ||
    (parsed.formationSettings && typeof parsed.formationSettings === 'object')
  ) {
    const phases = Array.isArray(parsed.formationPhases)
      ? parsed.formationPhases.map((p, i) => normalizeFormationPhaseForImport(p, i))
      : [];
    const settings =
      parsed.formationSettings && typeof parsed.formationSettings === 'object'
        ? sanitizeFormationSettings(parsed.formationSettings)
        : DEFAULT_FORMATION_SETTINGS;
    return { phases, settings };
  }

  if (
    Array.isArray(parsed.formation_phases) ||
    (parsed.formation_settings && typeof parsed.formation_settings === 'object')
  ) {
    const phases = Array.isArray(parsed.formation_phases)
      ? parsed.formation_phases.map((p, i) => normalizeFormationPhaseForImport(p, i))
      : [];
    const settings =
      parsed.formation_settings && typeof parsed.formation_settings === 'object'
        ? sanitizeFormationSettings(parsed.formation_settings)
        : DEFAULT_FORMATION_SETTINGS;
    return { phases, settings };
  }

  return null;
};

const getPathDeliveryErrorMessage = async (response) => {
  const rawText = await response.text().catch(() => '');
  if (!rawText) return response.statusText || `요청 실패: ${response.status}`;

  try {
    const json = JSON.parse(rawText);
    const headline =
      (typeof json.error === 'string' && json.error) ||
      (typeof json.message === 'string' && json.message) ||
      '';

    // Collect any extra diagnostic fields the backend may include so we don't
    // hide useful validation info behind the short headline.
    const detailFields = [
      'details',
      'detail',
      'reason',
      'reasons',
      'errors',
      'validation',
      'validation_errors',
      'failed',
      'description',
    ];
    const extraParts = [];
    for (const key of detailFields) {
      const value = json[key];
      if (value === undefined || value === null) continue;
      const formatted =
        typeof value === 'string' ? value : JSON.stringify(value, null, 2);
      if (formatted) extraParts.push(`${key}: ${formatted}`);
    }

    if (headline && extraParts.length) {
      return `${headline}\n${extraParts.join('\n')}`;
    }
    if (headline) return headline;
    if (extraParts.length) return extraParts.join('\n');
    return JSON.stringify(json, null, 2);
  } catch {
    return rawText;
  }
};

const toFiniteShowCoordinate = (coordinate) => {
  if (!Array.isArray(coordinate) || coordinate.length < 3) return null;
  const x = Number(coordinate[0]);
  const y = Number(coordinate[1]);
  const z = Number(coordinate[2]);
  return Number.isFinite(x) && Number.isFinite(y) && Number.isFinite(z)
    ? [x, y, z]
    : null;
};

const almostEqualCoordinate = (a, b) => (
  Array.isArray(a) &&
  Array.isArray(b) &&
  a.length >= 3 &&
  b.length >= 3 &&
  Math.abs(Number(a[0]) - Number(b[0])) < 1e-6 &&
  Math.abs(Number(a[1]) - Number(b[1])) < 1e-6 &&
  Math.abs(Number(a[2]) - Number(b[2])) < 1e-6
);

const makeCoordinateTransformerForPlayback = () => {
  // The 3D path preview/editor works in show-local coordinates. Imported .skyc
  // trajectories already store these local NWU points, so do not re-project them
  // through the map/world coordinate transformer here.
  return (coordinate) => toFiniteShowCoordinate(coordinate);
};

const convertTrajectoryToPlaybackPath = (trajectory, transformCoordinate, initialCoordinate) => {
  if (!trajectory || !Array.isArray(trajectory.points) || !trajectory.points.length) {
    return null;
  }

  const takeoffTimeMs = Math.max(0, Number(trajectory.takeoffTime) || 0) * 1000;
  const rawPoints = trajectory.points
    .map((keyframe) => {
      if (!Array.isArray(keyframe) || keyframe.length < 2) return null;
      const timestampMs = Math.max(0, Number(keyframe[0]) || 0) * 1000;
      const position = transformCoordinate(keyframe[1]);
      if (!position) return null;
      return { timestampMs: takeoffTimeMs + timestampMs, position };
    })
    .filter(Boolean)
    .sort((a, b) => a.timestampMs - b.timestampMs);

  if (!rawPoints.length) return null;

  const transformedInitial = initialCoordinate
    ? transformCoordinate(initialCoordinate)
    : null;
  const initialPos = transformedInitial || rawPoints[0].position;
  const hasExplicitInitial = !!transformedInitial;
  const firstStartsAtInitial = almostEqualCoordinate(rawPoints[0].position, initialPos);

  const path = rawPoints.map((point, index) => {
    const durationMs =
      index === 0 && !hasExplicitInitial
        ? 0
        : index === 0
          ? Math.max(0, Math.round(firstStartsAtInitial ? 0 : point.timestampMs))
          : Math.max(0, Math.round(point.timestampMs - rawPoints[index - 1].timestampMs));
    const [x, y, z] = point.position;
    return { x, y, z, durationMs };
  });

  if (!hasExplicitInitial && rawPoints[0].timestampMs > 0) {
    const [x, y, z] = rawPoints[0].position;
    path.splice(1, 0, {
      x,
      y,
      z,
      durationMs: Math.round(rawPoints[0].timestampMs),
    });
  }

  return {
    initialPos,
    path,
  };
};

const buildDroneConfigFromShowSpec = ({
  flatEarthCoordinateTransformer,
  indoor,
  showToWorldCoordinate,
  swarm,
}) => {
  if (!Array.isArray(swarm) || !swarm.length) return null;

  const transformCoordinate = makeCoordinateTransformerForPlayback({
    flatEarthCoordinateTransformer,
    indoor,
    showToWorldCoordinate,
  });

  const drones = swarm
    .map((drone, index) => {
      const trajectory = drone?.settings?.trajectory ?? drone?.trajectory;
      const converted = convertTrajectoryToPlaybackPath(
        trajectory,
        transformCoordinate,
        drone?.settings?.home ?? drone?.home
      );
      if (!converted) return null;

      // .skyc 로드 시 home 등과 무관하게 씬/JSON 기준 시작점을 path 첫 점과 통일
      let { initialPos, path } = converted;
      if (Array.isArray(path) && path.length > 0) {
        const p0 = path[0];
        const fx = Number(p0.x);
        const fy = Number(p0.y);
        const fz = Number(p0.z);
        if (Number.isFinite(fx) && Number.isFinite(fy) && Number.isFinite(fz)) {
          initialPos = [fx, fy, fz];
        }
      }

      const id =
        drone?.id !== undefined && drone?.id !== null && String(drone.id).trim() !== ''
          ? String(drone.id)
          : `show-drone-${index + 1}`;
      return {
        id,
        name: drone?.name || `Show drone ${index + 1}`,
        battery: 100,
        status: 'Show',
        pos: initialPos,
        initialPos,
        path,
      };
    })
    .filter(Boolean);

  return drones.length ? { drones, source: 'showSpec' } : null;
};

const getShowSpecDroneConfigForThreeDView = createSelector(
  getFlatEarthCoordinateTransformer,
  isShowIndoor,
  getOutdoorShowToWorldCoordinateSystemTransformation,
  getDroneSwarmSpecification,
  (
    flatEarthCoordinateTransformer,
    indoor,
    showToWorldCoordinate,
    swarm
  ) =>
    buildDroneConfigFromShowSpec({
      flatEarthCoordinateTransformer,
      indoor,
      showToWorldCoordinate,
      swarm,
    })
);

const ThreeDView = React.forwardRef((props, ref) => {
  const {
    cameraRef,
    grid,
    interactionMode,
    isCreateMode: isCreateModeProp,
    isCoordinateSystemLeftHanded,
    lighting,
    navigation,
    naturalLighting,
    sceneId,
    scenery,
    showAxes,
    showHomePositions,
    showLandingPositions,
    showStatistics,
    showTrajectoriesOfSelection,
    showSpecDroneConfig,
    uavToMissionIndex,
    viewRuntime,
    persistRehydrated,
    onSetViewRuntimeState,
  } = props;

  const isCreateMode =
    typeof isCreateModeProp === 'boolean'
      ? isCreateModeProp
      : interactionMode === 'create';

  const persistedDroneConfig =
    viewRuntime && typeof viewRuntime === 'object' ? viewRuntime.droneConfig : null;
  const persistedFormationPhases =
    viewRuntime && typeof viewRuntime === 'object' && Array.isArray(viewRuntime.formationPhases)
      ? viewRuntime.formationPhases
      : [];
  const persistedFormationSettings =
    viewRuntime && typeof viewRuntime === 'object' ? viewRuntime.formationSettings : null;
  const persistedPathProgressRaw =
    viewRuntime && typeof viewRuntime === 'object' ? viewRuntime.pathProgress : 0;
  const persistedPathProgress = Number.isFinite(Number(persistedPathProgressRaw))
    ? Number(persistedPathProgressRaw)
    : 0;

  // 선택된 드론 정보 및 JSON에서 불러온 드론 구성
  const [selectedDrone, setSelectedDrone] = useState(null);
  const [droneConfig, setDroneConfig] = useState(() => (
    persistedDroneConfig && typeof persistedDroneConfig === 'object'
      ? persistedDroneConfig
      : null
  ));
  const [pendingAutoSelectDrone, setPendingAutoSelectDrone] = useState(null);
  const droneConfigRef = useRef(null);
  droneConfigRef.current = droneConfig;
  const ignorePersistedDroneConfigRef = useRef(false);
  const formationHydratedFromPersistRef = useRef(false);
  const snapDronesToHomeAfterRehydrateRef = useRef(false);

  // 드론 추가 모달
  const [addDroneModalOpen, setAddDroneModalOpen] = useState(false);
  const [pathGeneratorModalOpen, setPathGeneratorModalOpen] = useState(false);
  const [isSendingPaths, setIsSendingPaths] = useState(false);
  const [pathDeliveryStatus, setPathDeliveryStatus] = useState('');
  const [pathProgress, setPathProgress] = useState(persistedPathProgress);
  const [isPlaybackRunning, setIsPlaybackRunning] = useState(false);
  const playbackClockRef = useRef({ startElapsedMs: 0, startedAt: 0 });

  const [formationPhases, setFormationPhases] = useState([]);
  const [formationSettings, setFormationSettings] = useState(DEFAULT_FORMATION_SETTINGS);
  const [isSendingFormation, setIsSendingFormation] = useState(false);
  const [formationDeliveryStatus, setFormationDeliveryStatus] = useState('');

  useEffect(() => {
    if (ignorePersistedDroneConfigRef.current) {
      return;
    }
    if (!droneConfig && persistedDroneConfig && typeof persistedDroneConfig === 'object') {
      setDroneConfig(persistedDroneConfig);
    }
  }, [droneConfig, persistedDroneConfig]);

  // persist 복원 직후 한 번: 저장된 마지막 좌표가 아니라 초기 위치로 정렬 (다음 저장에도 반영)
  useEffect(() => {
    if (!persistRehydrated) return;
    if (ignorePersistedDroneConfigRef.current) return;
    if (snapDronesToHomeAfterRehydrateRef.current) return;

    if (
      showSpecDroneConfig &&
      Array.isArray(showSpecDroneConfig.drones) &&
      showSpecDroneConfig.drones.length
    ) {
      snapDronesToHomeAfterRehydrateRef.current = true;
      return;
    }

    const source =
      droneConfig && Array.isArray(droneConfig.drones) && droneConfig.drones.length
        ? droneConfig
        : persistedDroneConfig &&
            typeof persistedDroneConfig === 'object' &&
            Array.isArray(persistedDroneConfig.drones) &&
            persistedDroneConfig.drones.length
          ? persistedDroneConfig
          : null;

    if (!source?.drones?.length) {
      snapDronesToHomeAfterRehydrateRef.current = true;
      return;
    }

    snapDronesToHomeAfterRehydrateRef.current = true;

    const nextDrones = source.drones.map((d) => {
      if (!d?.id) return d;
      const [x, y, z] = getDroneHomePositionTupleForReload(d);
      const out = { ...d, pos: [x, y, z] };
      if (Array.isArray(d.path) && d.path.length > 0) {
        out.path = [{ ...d.path[0], x, y, z }, ...d.path.slice(1)];
      }
      return out;
    });

    setDroneConfig({ ...source, drones: nextDrones });
    setPathProgress(0);
    setIsPlaybackRunning(false);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        nextDrones.forEach((d) => {
          if (!d.id) return;
          const [x, y, z] = getDroneHomePositionTupleForReload(d);
          if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) return;
          window.dispatchEvent(
            new CustomEvent('drone-move-request', {
              detail: { id: d.id, x, y, z },
            })
          );
        });
      });
    });
  }, [
    persistRehydrated,
    droneConfig,
    persistedDroneConfig,
    showSpecDroneConfig,
  ]);

  useEffect(() => {
    onSetViewRuntimeState({
      droneConfig,
      pathProgress,
      formationPhases,
      formationSettings,
    });
  }, [
    droneConfig,
    pathProgress,
    formationPhases,
    formationSettings,
    onSetViewRuntimeState,
  ]);

  const collectConfigFromScene = useCallback(() => collectConfigFromSceneUtil(), []);

  useThreeDViewDroneEvents({
    droneConfigRef,
    setSelectedDrone,
    setDroneConfig,
    setPathProgress,
    collectConfigFromScene,
  });

  const extraCameraProps = {
    'advanced-camera-controls': objectToString({
      acceptsKeyboardEvent: 'notEditable',
      embedded: true,
      fly: navigation && navigation.mode === 'fly',
      minAltitude: 0.5,
      reverseMouseDrag: true,
    }),
    'look-controls': objectToString({ enabled: false }),
    'wasd-controls': objectToString({ enabled: false }),
  };

  const extraSceneProps = {};
  if (showStatistics) extraSceneProps.stats = 'true';

  const panelOpen =
    isCreateMode && !!selectedDrone && selectedDrone.source !== 'uav';
  const effectiveLighting = naturalLighting || lighting;

  useEffect(() => {
    if (isCreateMode) return;
    setIsPlaybackRunning(false);
    setAddDroneModalOpen(false);
    setPathGeneratorModalOpen(false);
    setSelectedDrone(null);
    setPendingAutoSelectDrone(null);
    window.dispatchEvent(new CustomEvent('drone-deselected'));
  }, [isCreateMode]);

  const closePanel = () => {
    // ✅ 패널 닫기 = 선택 해제까지 같이 일어나게 (A-Frame도 정리되도록)
    window.dispatchEvent(new CustomEvent('drone-deselected'));
    setSelectedDrone(null);
  };

  const fileInputRef = useRef(null);

  const handleLoadConfigClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        if (!parsed || !Array.isArray(parsed.drones)) {
          // eslint-disable-next-line no-console
          console.warn('[ThreeDView] invalid drone config JSON (missing "drones" array)');
          return;
        }
        const normalizedDrones = parsed.drones.map((d, index) => {
          const normalized = normalizeDroneForConfigIO(d, index);
          return {
            ...normalized,
            initialPos: normalized.initialPos.slice(),
          };
        });

        const formationImport = readFormationImportFromParsed(parsed);
        if (formationImport) {
          setFormationPhases(
            remapFormationPhasesToDroneIds(formationImport.phases, normalizedDrones)
          );
          setFormationSettings(formationImport.settings);
        }

        setDroneConfig({
          ...stripFormationFromDroneConfigRoot(parsed),
          drones: normalizedDrones,
        });
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('[ThreeDView] failed to parse drone config JSON', err);
      }
    };
    reader.readAsText(file);
  };

  const handleSaveConfigClick = () => {
    const baseConfig =
      droneConfig && Array.isArray(droneConfig.drones) && droneConfig.drones.length
        ? droneConfig
        : collectConfigFromScene();

    const droneRows =
      baseConfig && Array.isArray(baseConfig.drones)
        ? baseConfig.drones.map((d, index) => {
            const normalized = normalizeDroneForConfigIO(
              {
                ...d,
                // Export format uses pos as canonical initial position.
                pos:
                  Array.isArray(d?.initialPos) && d.initialPos.length >= 3
                    ? d.initialPos
                    : d?.pos,
              },
              index
            );
            const { initialPos, ...exported } = normalized;
            return {
              ...exported,
              initial_position: initialPos,
            };
          })
        : [];

    const dronesForFormationKeys =
      baseConfig && Array.isArray(baseConfig.drones) ? baseConfig.drones : [];
    const phasesAligned = remapFormationPhasesToDroneIds(
      formationPhases,
      dronesForFormationKeys.map((d, index) => normalizeDroneForConfigIO(d, index))
    );

    const configToSave = {
      drones: droneRows,
      formation: {
        phases: phasesAligned.map((p) => ({
          id: p.id,
          name: String(p.name || '').trim() || 'phase',
          holdMs: Math.max(0, Math.round(Number(p.holdMs) || 0)),
          points:
            p.points && typeof p.points === 'object' && !Array.isArray(p.points)
              ? { ...p.points }
              : {},
        })),
        settings: sanitizeFormationSettings(formationSettings),
      },
    };

    const blob = new Blob([JSON.stringify(configToSave, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'three-d-drone-config.json';
    document.body.appendChild(a);
    a.click();
    if (a.parentNode === document.body) {
      try {
        document.body.removeChild(a);
      } catch (error) {
        if (error?.name !== 'NotFoundError') throw error;
      }
    }
    URL.revokeObjectURL(url);
  };

  const buildPathDeliveryPayload = (baseConfig) => {
    const drones = Array.isArray(baseConfig?.drones) ? baseConfig.drones : [];
    return {
      drones: drones
        .map((d, index) => normalizeDroneForConfigIO(d, index))
        .filter((d) => d.id && Array.isArray(d.path) && d.path.length)
        .map((d) => ({
          id: d.id,
          initial_position: d.initialPos,
          path: d.path.map((point) => {
            const nextPoint = {
              x: point.x,
              y: point.y,
              z: point.z,
              durationMs: point.durationMs,
            };
            if (Number(point.holdMs) > 0) {
              nextPoint.holdMs = point.holdMs;
            }
            return nextPoint;
          }),
        })),
      output: 'skyc',
      download: true,
    };
  };

  const handleSendPathsClick = async () => {
    const baseConfig =
      effectiveConfig && Array.isArray(effectiveConfig.drones) && effectiveConfig.drones.length
        ? effectiveConfig
        : collectConfigFromScene();
    const payload = buildPathDeliveryPayload(baseConfig);

    if (!payload.drones.length) {
      setPathDeliveryStatus('전달할 드론 경로가 없습니다.');
      return;
    }

    const usedUrl = DEFAULT_PATH_DELIVERY_URL;
    setIsSendingPaths(true);
    setPathDeliveryStatus('');

    try {
      const response = await fetch(usedUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const msg = await getPathDeliveryErrorMessage(response);
        throw new Error(msg || `요청 실패: ${response.status}`);
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = 'path-planner.skyc';
      document.body.appendChild(a);
      a.click();
      if (a.parentNode === document.body) {
        try {
          document.body.removeChild(a);
        } catch (error) {
          if (error?.name !== 'NotFoundError') throw error;
        }
      }
      URL.revokeObjectURL(objectUrl);

      setPathDeliveryStatus(
        `경로 전달 완료: ${payload.drones.length}대\npath-planner.skyc 다운로드가 시작되었습니다.\nURL: ${usedUrl}\nProxy target: ${PATH_DELIVERY_PROXY_TARGET}`
      );
    } catch (error) {
      setPathDeliveryStatus(
        `경로 전달 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}\nURL: ${usedUrl}\nProxy target: ${PATH_DELIVERY_PROXY_TARGET}`
      );
    } finally {
      setIsSendingPaths(false);
    }
  };

  const handleAddDrone = (newDrone) => {
    setDroneConfig((prev) => {
      const base =
        prev && Array.isArray(prev.drones) && prev.drones.length
          ? prev
          : collectConfigFromScene();

      const existingDrones =
        base && Array.isArray(base.drones) ? base.drones : [];

      return { ...base, drones: [...existingDrones, newDrone] };
    });
    setPendingAutoSelectDrone(newDrone);
  };

  useEffect(() => {
    if (!pendingAutoSelectDrone?.id) return undefined;
    if (typeof document === 'undefined') {
      setPendingAutoSelectDrone(null);
      return undefined;
    }

    let cancelled = false;
    let tries = 0;
    let rafId = null;

    const trySelect = () => {
      if (cancelled) return;
      tries += 1;

      const sceneEl = document.querySelector('a-scene');
      const safeId =
        typeof CSS !== 'undefined' && typeof CSS.escape === 'function'
          ? CSS.escape(pendingAutoSelectDrone.id)
          : pendingAutoSelectDrone.id;
      const target = sceneEl?.querySelector?.(`[data-drone-id="${safeId}"]`);

      if (target) {
        const position = parsePositionLike(target.getAttribute('position'), [0, 1, 1]);
        const initialPos = parsePositionLike(target.getAttribute('data-initial-pos'), position);
        window.dispatchEvent(
          new CustomEvent('drone-selected', {
            detail: {
              id: pendingAutoSelectDrone.id,
              name: pendingAutoSelectDrone.name,
              battery: pendingAutoSelectDrone.battery,
              status: pendingAutoSelectDrone.status,
              path: Array.isArray(pendingAutoSelectDrone.path) ? pendingAutoSelectDrone.path : [],
              currentPosition: { x: position[0], y: position[1], z: position[2] },
              initialPosition: { x: initialPos[0], y: initialPos[1], z: initialPos[2] },
            },
          })
        );
        setPendingAutoSelectDrone(null);
        return;
      }

      if (tries < 30) {
        rafId = requestAnimationFrame(trySelect);
      } else {
        setPendingAutoSelectDrone(null);
      }
    };

    rafId = requestAnimationFrame(trySelect);
    return () => {
      cancelled = true;
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [pendingAutoSelectDrone]);

  const [gizmoDragState, setGizmoDragState] = useState({ dragging: false, axis: null });
  const effectiveConfig = useMemo(() => {
    if (
      showSpecDroneConfig &&
      Array.isArray(showSpecDroneConfig.drones) &&
      showSpecDroneConfig.drones.length
    ) {
      return showSpecDroneConfig;
    }
    if (droneConfig && Array.isArray(droneConfig.drones) && droneConfig.drones.length) {
      return droneConfig;
    }
    return collectConfigFromScene();
  }, [droneConfig, showSpecDroneConfig]);
  droneConfigRef.current = effectiveConfig;

  const selectedPathDroneId = useMemo(() => {
    if (!selectedDrone?.id || !Array.isArray(effectiveConfig?.drones)) return undefined;

    const selectedId = String(selectedDrone.id);
    const directMatch = effectiveConfig.drones.find((d) => String(d?.id) === selectedId);
    if (directMatch?.id) return directMatch.id;

    if (selectedDrone.source === 'uav') {
      const missionIndex = uavToMissionIndex?.[selectedId];
      const mappedDrone = Number.isInteger(missionIndex)
        ? effectiveConfig.drones[missionIndex]
        : null;
      if (mappedDrone?.id) return mappedDrone.id;
    }

    return undefined;
  }, [effectiveConfig, selectedDrone, uavToMissionIndex]);

  useEffect(() => {
    if (ignorePersistedDroneConfigRef.current) {
      return;
    }
    if (!persistRehydrated) {
      return;
    }
    if (formationHydratedFromPersistRef.current) {
      return;
    }
    if (!Array.isArray(persistedFormationPhases) || persistedFormationPhases.length === 0) {
      formationHydratedFromPersistRef.current = true;
      return;
    }

    const drones =
      effectiveConfig && Array.isArray(effectiveConfig.drones) ? effectiveConfig.drones : [];
    if (!drones.length) {
      return;
    }

    const normPhases = persistedFormationPhases.map((p, i) =>
      normalizeFormationPhaseForImport(p, i)
    );
    const normalizedDrones = drones.map((d, i) => normalizeDroneForConfigIO(d, i));
    setFormationPhases(remapFormationPhasesToDroneIds(normPhases, normalizedDrones));
    setFormationSettings(
      sanitizeFormationSettings(
        persistedFormationSettings &&
          typeof persistedFormationSettings === 'object' &&
          !Array.isArray(persistedFormationSettings)
          ? persistedFormationSettings
          : DEFAULT_FORMATION_SETTINGS
      )
    );
    formationHydratedFromPersistRef.current = true;
  }, [
    persistRehydrated,
    persistedFormationPhases,
    persistedFormationSettings,
    effectiveConfig,
  ]);

  const playbackSourceLabel =
    effectiveConfig?.source === 'showSpec'
      ? '로드된 .skyc spec'
      : '3D JSON/수동 경로';

  const maxPathDurationMs = useMemo(() => {
    if (!effectiveConfig || !Array.isArray(effectiveConfig.drones)) return 0;
    return effectiveConfig.drones.reduce((max, d) => {
      const seekPath = buildSeekPathWithInitial(d);
      const total = getPathTotalDurationMs(seekPath);
      return Math.max(max, total);
    }, 0);
  }, [effectiveConfig]);

  const currentPositionMs =
    maxPathDurationMs * (Math.min(100, Math.max(0, Number(pathProgress) || 0)) / 100);

  const applyProgressToAll = (progressPercent) => {
    const base = effectiveConfig;

    if (!base || !Array.isArray(base.drones) || !base.drones.length) return;

    const progress = Math.min(100, Math.max(0, Number(progressPercent) || 0)) / 100;
    const elapsedMs = maxPathDurationMs * progress;

    base.drones.forEach((d) => {
      if (!Array.isArray(d.path) || !d.path.length || !d.id) return;

      const seekPath = buildSeekPathWithInitial(d);
      if (!seekPath.length) return;
      const sliced = slicePathByElapsedMs(seekPath, elapsedMs);
      if (!sliced.length) return;

      const point = sliced[0];
      const x = Number(point.x);
      const y = Number(point.y);
      const z = Number(point.z);
      if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) return;

      // 슬라이더 이동 시 즉시 해당 진행 위치로 점프(기존 애니메이션은 브리지에서 취소)
      window.dispatchEvent(
        new CustomEvent('drone-move-request', {
          detail: {
            id: d.id,
            x,
            y,
            z,
          },
        })
      );
    });
  };

  const handlePathProgressChange = (nextValue) => {
    setIsPlaybackRunning(false);
    setPathProgress(nextValue);
    applyProgressToAll(nextValue);
  };

  useEffect(() => {
    if (!isPlaybackRunning || maxPathDurationMs <= 0) return undefined;

    let rafId = null;
    const tick = (now) => {
      const elapsedMs =
        playbackClockRef.current.startElapsedMs +
        (now - playbackClockRef.current.startedAt);
      const nextProgress = Math.min(100, (elapsedMs / maxPathDurationMs) * 100);

      setPathProgress(nextProgress);

      if (nextProgress >= 100) {
        setIsPlaybackRunning(false);
        return;
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [isPlaybackRunning, maxPathDurationMs]);

  useEffect(() => {
    const onGizmoDragState = (e) => {
      const detail = e.detail || {};
      setGizmoDragState({
        dragging: !!detail.dragging,
        axis: detail.axis || null,
      });
    };

    window.addEventListener('drone-gizmo-drag-state', onGizmoDragState);
    return () => window.removeEventListener('drone-gizmo-drag-state', onGizmoDragState);
  }, []);

  const handlePlayAll = () => {
    const base = effectiveConfig;

    if (!base || !Array.isArray(base.drones) || !base.drones.length) return;

    const progress = Math.min(100, Math.max(0, Number(pathProgress) || 0)) / 100;
    const elapsedMs = maxPathDurationMs * progress;
    if (maxPathDurationMs <= 0 || elapsedMs >= maxPathDurationMs) return;

    playbackClockRef.current = {
      startElapsedMs: elapsedMs,
      startedAt: performance.now(),
    };
    setIsPlaybackRunning(true);

    base.drones.forEach((d) => {
      if (!Array.isArray(d.path) || !d.path.length || !d.id) return;
      const playPathBase = buildSeekPathWithInitial(d);
      if (!playPathBase.length) return;
      const remainingPath = slicePathByElapsedMs(playPathBase, elapsedMs);
      if (!remainingPath.length) return;

      window.dispatchEvent(
        new CustomEvent('drone-path-request', {
          detail: {
            id: d.id,
            points: remainingPath,
            durationPerSegment: 1000,
            startFromInitial: true,
          },
        })
      );
    });
  };

  const handleResetAll = () => {
    setIsPlaybackRunning(false);
    setPathProgress(0);
    const base = effectiveConfig;

    if (!base || !Array.isArray(base.drones) || !base.drones.length) return;

    base.drones.forEach((d) => {
      // path[0]이 곧 시작 위치. 없으면 기존 initialPos/pos로 fallback.
      const [x, y, z] = getDroneInitialPositionTuple(d);
      if (!d.id) return;
      if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) return;

      window.dispatchEvent(
        new CustomEvent('drone-path-request', {
          detail: {
            id: d.id,
            points: [{ x, y, z, durationMs: 1000 }],
            durationPerSegment: 1000,
            startFromInitial: false,
          },
        })
      );
    });
  };

  const handleResetPanelSettings = () => {
    // Prevent immediate re-hydration of old persisted runtime config.
    ignorePersistedDroneConfigRef.current = true;
    formationHydratedFromPersistRef.current = true;
    setPathProgress(0);
    setSelectedDrone(null);
    setPendingAutoSelectDrone(null);
    window.dispatchEvent(new CustomEvent('drone-deselected'));
    setDroneConfig(null);
    setFormationPhases([]);
    setFormationSettings(DEFAULT_FORMATION_SETTINGS);
    setFormationDeliveryStatus('');
  };

  const generateFormationPhaseId = () =>
    `phase-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

  const handleAddFormationPhase = useCallback(() => {
    const points = readAllDronePositionsFromDom();
    setFormationPhases((prev) => {
      const fallbackName = `phase-${prev.length + 1}`;
      return [
        ...prev,
        {
          id: generateFormationPhaseId(),
          name: fallbackName,
          holdMs: 3000,
          points,
        },
      ];
    });
  }, []);

  const handleUpdateFormationPhaseMeta = useCallback((phaseId, updates) => {
    setFormationPhases((prev) =>
      prev.map((phase) => (phase.id === phaseId ? { ...phase, ...updates } : phase))
    );
  }, []);

  const handleUpdateFormationDronePosition = useCallback(
    (phaseId, droneId, position) => {
      if (!phaseId || !droneId) return;
      setFormationPhases((prev) =>
        prev.map((phase) => {
          if (phase.id !== phaseId) return phase;
          const nextPoints = { ...(phase.points || {}) };
          if (position === null) {
            delete nextPoints[droneId];
          } else {
            nextPoints[droneId] = position;
          }
          return { ...phase, points: nextPoints };
        })
      );
    },
    []
  );

  const handleCaptureDronePositionInPhase = useCallback(
    (phaseId, droneId) => {
      const pos = readDronePositionFromDom(droneId);
      if (!pos) return;
      handleUpdateFormationDronePosition(phaseId, droneId, pos);
    },
    [handleUpdateFormationDronePosition]
  );

  const handleCaptureAllPositionsInPhase = useCallback((phaseId) => {
    const points = readAllDronePositionsFromDom();
    setFormationPhases((prev) =>
      prev.map((phase) => (phase.id === phaseId ? { ...phase, points } : phase))
    );
  }, []);

  const handleRemoveFormationPhase = useCallback((phaseId) => {
    setFormationPhases((prev) => prev.filter((phase) => phase.id !== phaseId));
  }, []);

  const handleMoveFormationPhase = useCallback((phaseId, direction) => {
    if (!phaseId || !direction) return;
    setFormationPhases((prev) => {
      const index = prev.findIndex((phase) => phase.id === phaseId);
      if (index < 0) return prev;
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;
      const next = prev.slice();
      const [moved] = next.splice(index, 1);
      next.splice(targetIndex, 0, moved);
      return next;
    });
  }, []);

  const handleUpdateFormationSettings = useCallback((updates) => {
    setFormationSettings((prev) => sanitizeFormationSettings({ ...prev, ...updates }));
  }, []);

  const handleApplyDronePositionInPhase = useCallback((phaseId, droneId) => {
    const phase = formationPhases.find((p) => p.id === phaseId);
    if (!phase) return;
    const position = phase.points?.[droneId];
    if (!position) return;
    const x = Number(position.x);
    const y = Number(position.y);
    const z = Number(position.z);
    if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) return;
    window.dispatchEvent(
      new CustomEvent('drone-move-request', {
        detail: { id: droneId, x, y, z },
      })
    );
  }, [formationPhases]);

  /** phase별 저장 좌표(미캡처 드론은 초기/경로 첫 점)로 전체 드론을 한 번에 이동 */
  const handleApplyAllDronesInPhase = useCallback(
    (phaseId) => {
      const phase = formationPhases.find((p) => p.id === phaseId);
      if (!phase) return;
      const drones = Array.isArray(effectiveConfig?.drones) ? effectiveConfig.drones : [];
      drones.forEach((d) => {
        if (!d?.id) return;
        const id = String(d.id);
        const captured = phase.points?.[id];
        let x;
        let y;
        let z;
        if (
          captured &&
          Number.isFinite(Number(captured.x)) &&
          Number.isFinite(Number(captured.y)) &&
          Number.isFinite(Number(captured.z))
        ) {
          x = Number(captured.x);
          y = Number(captured.y);
          z = Number(captured.z);
        } else {
          [x, y, z] = getDroneInitialPositionTuple(d);
        }
        if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) return;
        window.dispatchEvent(
          new CustomEvent('drone-move-request', {
            detail: { id: d.id, x, y, z },
          })
        );
      });
    },
    [formationPhases, effectiveConfig]
  );

  const buildFormationPayload = useCallback(() => {
    const drones = Array.isArray(effectiveConfig?.drones) ? effectiveConfig.drones : [];
    const initial = drones
      .filter((d) => d?.id)
      .map((d) => {
        const [x, y, z] = getDroneInitialPositionTuple(d);
        return { droneId: String(d.id), x, y, z };
      });

    const phases = formationPhases.map((phase) => {
      const points = drones
        .filter((d) => d?.id)
        .map((d) => {
          const id = String(d.id);
          const captured = phase.points?.[id];
          if (
            captured &&
            Number.isFinite(Number(captured.x)) &&
            Number.isFinite(Number(captured.y)) &&
            Number.isFinite(Number(captured.z))
          ) {
            return {
              droneId: id,
              x: Number(captured.x),
              y: Number(captured.y),
              z: Number(captured.z),
            };
          }
          const [x, y, z] = getDroneInitialPositionTuple(d);
          return { droneId: id, x, y, z };
        });

      const holdMs = Math.max(0, Math.round(Number(phase.holdMs) || 0));
      const name = String(phase.name || '').trim() || `phase`;
      return { name, holdMs, points };
    });

    const sanitized = sanitizeFormationSettings(formationSettings);
    const payload = {
      initial,
      phases,
      step_size: sanitized.step_size,
      duration_ms: sanitized.duration_ms,
      auto_upload: sanitized.auto_upload,
    };
    // output은 빈 문자열이면 생략 → 백엔드가 기본값(.skyc 다운로드)으로 처리.
    if (sanitized.output) {
      payload.output = sanitized.output;
    }
    // takeoff_time은 옵션값이므로 0보다 클 때만 포함 (백엔드 기본 포맷과 정렬)
    if (Number(sanitized.takeoff_time) > 0) {
      payload.takeoff_time = sanitized.takeoff_time;
    }
    return payload;
  }, [effectiveConfig, formationPhases, formationSettings]);

  const handleSendFormationPlan = useCallback(async () => {
    if (!formationPhases.length) {
      setFormationDeliveryStatus('포메이션 phase를 먼저 추가해주세요.');
      return;
    }

    const payload = buildFormationPayload();
    if (!payload.initial.length) {
      setFormationDeliveryStatus('드론이 없습니다. 먼저 드론을 추가해주세요.');
      return;
    }
    if (!payload.phases.length) {
      setFormationDeliveryStatus('전송할 포메이션 phase가 없습니다.');
      return;
    }

    const usedUrl = DEFAULT_PATH_DELIVERY_URL;
    const requestBody = JSON.stringify(payload);
    const payloadPreview = requestBody.length > 600
      ? `${requestBody.slice(0, 600)}... (총 ${requestBody.length}자)`
      : requestBody;

    // Log full payload so user can verify it matches the backend spec.
    // eslint-disable-next-line no-console
    console.log('[Formation] POST', usedUrl, payload);

    setIsSendingFormation(true);
    setFormationDeliveryStatus('');

    try {
      const response = await fetch(usedUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: requestBody,
      });

      if (!response.ok) {
        const msg = await getPathDeliveryErrorMessage(response);
        throw new Error(msg || `요청 실패: ${response.status}`);
      }

      const contentType = (response.headers.get('content-type') || '').toLowerCase();
      const isJsonResponse = contentType.includes('application/json');
      let summaryDetail = '';

      if (isJsonResponse) {
        const json = await response.json().catch(() => null);
        if (json && typeof json === 'object') {
          summaryDetail = `\n응답: ${JSON.stringify(json).slice(0, 240)}`;
        }
      } else {
        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        // output 미지정 또는 'skyc' = .skyc, 'show' = .show, 'path' = .json (보통은 JSON 응답).
        const ext = payload.output === 'show'
          ? 'show'
          : payload.output === 'path'
            ? 'json'
            : 'skyc';
        a.href = objectUrl;
        a.download = `formation-plan.${ext}`;
        document.body.appendChild(a);
        a.click();
        if (a.parentNode === document.body) {
          try {
            document.body.removeChild(a);
          } catch (error) {
            if (error?.name !== 'NotFoundError') throw error;
          }
        }
        URL.revokeObjectURL(objectUrl);
        summaryDetail = `\n다운로드: formation-plan.${ext}`;
      }

      setFormationDeliveryStatus(
        `포메이션 전달 완료: ${payload.initial.length}대 · phase ${payload.phases.length}개${summaryDetail}\nURL: ${usedUrl}\nProxy target: ${PATH_DELIVERY_PROXY_TARGET}`
      );
    } catch (error) {
      const baseMsg = error instanceof Error ? error.message : '알 수 없는 오류';
      const looksLikeOldBackend = /must be arrays of \[x,y,z\]/i.test(baseMsg);
      const hint = looksLikeOldBackend
        ? '\n\n[힌트] 백엔드가 phase-based 포맷(initial+phases)을 인식하지 못합니다.\n→ localhost:5001 path-planner 서버를 새 버전으로 업데이트/재시작해주세요.'
        : '';
      setFormationDeliveryStatus(
        `포메이션 전달 실패: ${baseMsg}${hint}\nURL: ${usedUrl}\nProxy target: ${PATH_DELIVERY_PROXY_TARGET}\n\n[보낸 페이로드]\n${payloadPreview}`
      );
    } finally {
      setIsSendingFormation(false);
    }
  }, [buildFormationPayload, formationPhases]);

  const sceneEditProps = isCreateMode
    ? { 'drone-move-bridge': '', 'drone-axis-gizmo': '' }
    : {};

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {isCreateMode && (
      <PathControlPanel
        fileInputRef={fileInputRef}
        pathProgress={pathProgress}
        onPathProgressChange={handlePathProgressChange}
        currentPositionMs={currentPositionMs}
        totalDurationMs={maxPathDurationMs}
        playbackSourceLabel={playbackSourceLabel}
        isPlaybackRunning={isPlaybackRunning}
        droneCount={
          effectiveConfig && Array.isArray(effectiveConfig.drones)
            ? effectiveConfig.drones.length
            : 0
        }
        onPlayAll={handlePlayAll}
        onResetAll={handleResetAll}
        onResetPanelSettings={handleResetPanelSettings}
        onLoadConfigClick={handleLoadConfigClick}
        onSaveConfigClick={handleSaveConfigClick}
        onOpenPathGenerator={() => setPathGeneratorModalOpen(true)}
        onSendPathsClick={handleSendPathsClick}
        onFileChange={handleFileChange}
        onAddDroneClick={() => setAddDroneModalOpen(true)}
        isSendingPaths={isSendingPaths}
        pathDeliveryStatus={pathDeliveryStatus}
      />
      )}
      {isCreateMode && (
      <AddDroneModal
        open={addDroneModalOpen}
        onClose={() => setAddDroneModalOpen(false)}
        onAdd={handleAddDrone}
        existingIds={
          effectiveConfig && Array.isArray(effectiveConfig.drones)
            ? effectiveConfig.drones.map((d) => d.id)
            : []
        }
      />
      )}
      {isCreateMode && (
      <PathGeneratorModal
        open={pathGeneratorModalOpen}
        onClose={() => setPathGeneratorModalOpen(false)}
      />
      )}
      <a-scene
        key={sceneId}
        ref={ref}
        deallocate
        embedded="true"
        keyboard-shortcuts="enterVR: false"
        loading-screen="backgroundColor: #424242; dotsColor: #888"
        renderer="antialias: false; colorManagement: true; physicallyCorrectLights: true"
        xr-mode-ui="enabled: false"
        device-orientation-permission-ui="enabled: false"
        tabIndex={-1}
        class="react-hotkeys-ignore no-focus-ring"
        {...sceneEditProps}
        {...extraSceneProps}
      >
        <a-assets>
          {isCreateMode && (
            <>
              <a-asset-item id="drone-fbx" src="assets/fbx/drone.fbx" />
              <a-mixin id="drone-marker" fbx-model="src: #drone-fbx; scale: 0.01 0.01 0.01" />
            </>
          )}
          <a-mixin
            id="takeoff-marker"
            geometry="primitive: triangle; vertexA: 1 0 0; vertexB: -0.5 0.866 0; vertexC: -0.5 -0.866 0"
            material={`color: ${Colors.markers.takeoff}; shader: flat; side: double`}
          />
          <a-mixin
            id="landing-marker"
            geometry="primitive: triangle; vertexA: -1 0 0; vertexB: 0.5 -0.866 0; vertexC: 0.5 0.866 0"
            material={`color: ${Colors.markers.landing}; shader: flat; side: double`}
          />
        </a-assets>

        {/* ✅ 마우스 피킹/호버 커서 */}
        <a-entity
          id="mouse-ray"
          click-pick=""
          hover-cursor="className: three-d-clickable; interval: 50"
        />

        {/* ✅ 카메라 */}
        <a-camera
          ref={cameraRef}
          sync-pose-with-store=""
          id="three-d-camera"
          {...extraCameraProps}
        />

        <a-entity rotation="-90 0 90">
          {showAxes && (
            <CoordinateSystemAxes
              leftHanded={isCoordinateSystemLeftHanded}
              length={10}
              lineWidth={10}
            />
          )}
          {/* {showHomePositions && effectiveConfig?.source !== 'showSpec' && (
            <HomePositionMarkers />
          )} */}
          {showLandingPositions && <LandingPositionMarkers />}
          {showTrajectoriesOfSelection && <SelectedTrajectories />}

          <SatelliteMapGround
            enabled={scenery === 'outdoor'}
            lighting={effectiveLighting}
          />
          <DronePathTrajectories
            drones={effectiveConfig && Array.isArray(effectiveConfig.drones) ? effectiveConfig.drones : undefined}
            selectedDroneId={selectedPathDroneId}
          />
          {isCreateMode && (
            <DroneShapeMarkers
              drones={
                effectiveConfig && Array.isArray(effectiveConfig.drones)
                  ? effectiveConfig.drones
                  : undefined
              }
            />
          )}
          {!isCreateMode && <a-drone-flock />}
          <Room />
        </a-entity>

        <Scenery type={`${scenery}-${effectiveLighting}`} grid={grid} />
      </a-scene>

      {/* ✅ 우측 패널 (Create 모드 전용) */}
      {isCreateMode && (
      <DroneInfoPanel
        open={panelOpen}
        onClose={closePanel}
        drone={selectedDrone}
        droneCount={
          effectiveConfig && Array.isArray(effectiveConfig.drones)
            ? effectiveConfig.drones.length
            : 0
        }
        formationPhases={formationPhases}
        formationSettings={formationSettings}
        isSendingFormation={isSendingFormation}
        formationDeliveryStatus={formationDeliveryStatus}
        onAddFormationPhase={handleAddFormationPhase}
        onRemoveFormationPhase={handleRemoveFormationPhase}
        onMoveFormationPhase={handleMoveFormationPhase}
        onUpdateFormationPhaseMeta={handleUpdateFormationPhaseMeta}
        onUpdateFormationDronePosition={handleUpdateFormationDronePosition}
        onCaptureDronePositionInPhase={handleCaptureDronePositionInPhase}
        onCaptureAllPositionsInPhase={handleCaptureAllPositionsInPhase}
        onApplyDronePositionInPhase={handleApplyDronePositionInPhase}
        onApplyAllDronesInPhase={handleApplyAllDronesInPhase}
        onUpdateFormationSettings={handleUpdateFormationSettings}
        onSendFormationPlan={handleSendFormationPlan}
      />
      )}

      {selectedDrone && !isCreateMode && (
        <DroneStatusOverlay drone={selectedDrone} />
      )}

      {/* ✅ 커서에서 시작하는 레이를 그릴 2D 오버레이 */}
      <div
        id="click-ray-overlay"
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 9999,
        }}
      />
      {panelOpen && (
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: 14,
            transform: 'translateX(-50%)',
            zIndex: 12000,
            pointerEvents: 'none',
            padding: '7px 13px',
            borderRadius: 999,
            border: '1px solid rgba(160,220,255,0.3)',
            background: 'linear-gradient(145deg, rgba(17,25,39,0.88), rgba(10,15,25,0.84))',
            color: '#e6f3ff',
            fontSize: 12,
            letterSpacing: 0.2,
            backdropFilter: 'blur(8px)',
          }}
        >
          {gizmoDragState.dragging && gizmoDragState.axis
            ? `${gizmoDragState.axis.toUpperCase()} 축 드래그 중`
            : '축(빨강 X / 파랑 Y / 초록 Z) 클릭 후 마우스 드래그'}
        </div>
      )}
    </div>
  );
});

ThreeDView.propTypes = {
  cameraRef: PropTypes.any,
  grid: PropTypes.string,
  interactionMode: PropTypes.oneOf(['view', 'create']),
  isCreateMode: PropTypes.bool,
  isCoordinateSystemLeftHanded: PropTypes.bool,
  lighting: PropTypes.oneOf(['dark', 'light']),
  naturalLighting: PropTypes.oneOf(['dark', 'light']),
  navigation: PropTypes.shape({
    mode: PropTypes.oneOf(['walk', 'fly']),
    parameters: PropTypes.object,
  }),
  sceneId: PropTypes.number,
  scenery: PropTypes.oneOf(['outdoor', 'indoor']),
  showAxes: PropTypes.bool,
  showHomePositions: PropTypes.bool,
  showLandingPositions: PropTypes.bool,
  showStatistics: PropTypes.bool,
  showTrajectoriesOfSelection: PropTypes.bool,
  showSpecDroneConfig: PropTypes.shape({
    drones: PropTypes.array,
    source: PropTypes.string,
  }),
  uavToMissionIndex: PropTypes.object,
  viewRuntime: PropTypes.shape({
    droneConfig: PropTypes.any,
    pathProgress: PropTypes.number,
    formationPhases: PropTypes.array,
    formationSettings: PropTypes.object,
  }),
  persistRehydrated: PropTypes.bool,
  onSetViewRuntimeState: PropTypes.func,
};

export default connect(
  (state) => ({
    isCoordinateSystemLeftHanded: isMapCoordinateSystemLeftHanded(state),
    persistRehydrated: state._persist?.rehydrated === true,
    ...state.settings.threeD,
    ...state.threeD,
    scenery: getEffectiveScenery(state),
    lighting: getLightingConditionsForThreeDView(state),
    naturalLighting: getNaturalLightingForThreeDView(state),
    showSpecDroneConfig: getShowSpecDroneConfigForThreeDView(state),
    uavToMissionIndex: getReverseMissionMapping(state),
  }),
  {
    onSetViewRuntimeState: setViewRuntimeState,
  },
  null,
  { forwardRef: true }
)(ThreeDView);
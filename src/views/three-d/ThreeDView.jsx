/**
 * @file Component that shows a three-dimensional view of the drone flock.
 */

import PropTypes from 'prop-types';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { connect } from 'react-redux';

import CoordinateSystemAxes from './CoordinateSystemAxes';
import DroneShapeMarkers from './DroneShapeMarkers';
import HomePositionMarkers from './HomePositionMarkers';
import LandingPositionMarkers from './LandingPositionMarkers';
import Room from './Room';
import Scenery from './Scenery';
import SelectedTrajectories from './SelectedTrajectories';
import DroneInfoPanel from './DroneInfoPanel';
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
import { setViewRuntimeState } from '~/features/three-d/slice';
import { isShowIndoor } from '~/features/show/selectors';
import { isMapCoordinateSystemLeftHanded } from '~/selectors/map';

const getEffectiveScenery = (state) => {
  return getEffectiveSceneryUtil(state, getSceneryForThreeDView, isShowIndoor);
};

const ThreeDView = React.forwardRef((props, ref) => {
  const {
    cameraRef,
    grid,
    isCoordinateSystemLeftHanded,
    lighting,
    navigation,
    sceneId,
    scenery,
    showAxes,
    showHomePositions,
    showLandingPositions,
    showStatistics,
    showTrajectoriesOfSelection,
    viewRuntime,
    onSetViewRuntimeState,
  } = props;

  const persistedDroneConfig =
    viewRuntime && typeof viewRuntime === 'object' ? viewRuntime.droneConfig : null;
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

  // 드론 추가 모달
  const [addDroneModalOpen, setAddDroneModalOpen] = useState(false);
  const [pathGeneratorModalOpen, setPathGeneratorModalOpen] = useState(false);
  const [pathProgress, setPathProgress] = useState(persistedPathProgress);

  useEffect(() => {
    if (ignorePersistedDroneConfigRef.current) {
      return;
    }
    if (!droneConfig && persistedDroneConfig && typeof persistedDroneConfig === 'object') {
      setDroneConfig(persistedDroneConfig);
    }
  }, [droneConfig, persistedDroneConfig]);

  useEffect(() => {
    onSetViewRuntimeState({ droneConfig, pathProgress });
  }, [droneConfig, pathProgress, onSetViewRuntimeState]);

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

  const panelOpen = !!selectedDrone;

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
            initialPos: normalized.pos.slice(),
          };
        });

        setDroneConfig({
          ...parsed,
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

    const configToSave =
      baseConfig && Array.isArray(baseConfig.drones)
        ? {
            drones: baseConfig.drones.map((d, index) => {
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
              return normalized;
            }),
          }
        : { drones: [] };

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
    if (droneConfig && Array.isArray(droneConfig.drones) && droneConfig.drones.length) {
      return droneConfig;
    }
    return collectConfigFromScene();
  }, [droneConfig]);

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
    const base =
      droneConfig && Array.isArray(droneConfig.drones) && droneConfig.drones.length
        ? droneConfig
        : collectConfigFromScene();

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
    setPathProgress(nextValue);
    applyProgressToAll(nextValue);
  };

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
    const base =
      droneConfig && Array.isArray(droneConfig.drones) && droneConfig.drones.length
        ? droneConfig
        : collectConfigFromScene();

    if (!base || !Array.isArray(base.drones) || !base.drones.length) return;

    const progress = Math.min(100, Math.max(0, Number(pathProgress) || 0)) / 100;
    const elapsedMs = maxPathDurationMs * progress;

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
    const base =
      droneConfig && Array.isArray(droneConfig.drones) && droneConfig.drones.length
        ? droneConfig
        : collectConfigFromScene();

    if (!base || !Array.isArray(base.drones) || !base.drones.length) return;

    base.drones.forEach((d) => {
      const resetPos = Array.isArray(d.initialPos) && d.initialPos.length >= 3 ? d.initialPos : d.pos;
      if (!Array.isArray(resetPos) || resetPos.length < 3 || !d.id) return;

      const [px, py, pz] = resetPos;
      const x = Number(px);
      const y = Number(py);
      const z = Number(pz);
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
    setPathProgress(0);
    setSelectedDrone(null);
    setPendingAutoSelectDrone(null);
    window.dispatchEvent(new CustomEvent('drone-deselected'));
    setDroneConfig(null);
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <PathControlPanel
        fileInputRef={fileInputRef}
        pathProgress={pathProgress}
        onPathProgressChange={handlePathProgressChange}
        currentPositionMs={currentPositionMs}
        totalDurationMs={maxPathDurationMs}
        onPlayAll={handlePlayAll}
        onResetAll={handleResetAll}
        onResetPanelSettings={handleResetPanelSettings}
        onLoadConfigClick={handleLoadConfigClick}
        onSaveConfigClick={handleSaveConfigClick}
        onOpenPathGenerator={() => setPathGeneratorModalOpen(true)}
        onFileChange={handleFileChange}
        onAddDroneClick={() => setAddDroneModalOpen(true)}
      />
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
      <PathGeneratorModal
        open={pathGeneratorModalOpen}
        onClose={() => setPathGeneratorModalOpen(false)}
      />
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
        drone-move-bridge=""
        drone-axis-gizmo=""
        {...extraSceneProps}
      >
        <a-assets>
          <a-asset-item id="drone-fbx" src="assets/fbx/drone.fbx" />
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
          <a-mixin id="drone-marker" fbx-model="src: #drone-fbx; scale: 0.01 0.01 0.01" />
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
          {showHomePositions && <HomePositionMarkers />}
          {showLandingPositions && <LandingPositionMarkers />}
          {showTrajectoriesOfSelection && <SelectedTrajectories />}

          <DroneShapeMarkers drones={droneConfig && Array.isArray(droneConfig.drones) ? droneConfig.drones : undefined} />
          <a-drone-flock />
          <Room />
        </a-entity>

        <Scenery type={`${scenery}-${lighting}`} grid={grid} />
      </a-scene>

      {/* ✅ 우측 패널 */}
      <DroneInfoPanel
        open={panelOpen}
        onClose={closePanel}
        drone={selectedDrone}
      />

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
            boxShadow: '0 6px 18px rgba(0,0,0,0.3)',
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
  isCoordinateSystemLeftHanded: PropTypes.bool,
  lighting: PropTypes.oneOf(['dark', 'light']),
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
  viewRuntime: PropTypes.shape({
    droneConfig: PropTypes.any,
    pathProgress: PropTypes.number,
  }),
  onSetViewRuntimeState: PropTypes.func,
};

export default connect(
  (state) => ({
    isCoordinateSystemLeftHanded: isMapCoordinateSystemLeftHanded(state),
    ...state.settings.threeD,
    ...state.threeD,
    scenery: getEffectiveScenery(state),
    lighting: getLightingConditionsForThreeDView(state),
  }),
  {
    onSetViewRuntimeState: setViewRuntimeState,
  },
  null,
  { forwardRef: true }
)(ThreeDView);
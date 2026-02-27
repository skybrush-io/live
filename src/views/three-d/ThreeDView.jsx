/**
 * @file Component that shows a three-dimensional view of the drone flock.
 */

import PropTypes from 'prop-types';
import React, { useEffect, useRef, useState } from 'react';
import { connect } from 'react-redux';

import CoordinateSystemAxes from './CoordinateSystemAxes';
import DroneShapeMarkers from './DroneShapeMarkers';
import HomePositionMarkers from './HomePositionMarkers';
import LandingPositionMarkers from './LandingPositionMarkers';
import Room from './Room';
import Scenery from './Scenery';
import SelectedTrajectories from './SelectedTrajectories';
import DroneInfoPanel from './DroneInfoPanel';

// eslint-disable-next-line no-unused-vars
import AFrame from '~/aframe';
import { objectToString } from '~/aframe/utils';
import Colors from '~/components/colors';
import {
  getLightingConditionsForThreeDView,
  getSceneryForThreeDView,
} from '~/features/settings/selectors';
import { isShowIndoor } from '~/features/show/selectors';
import { isMapCoordinateSystemLeftHanded } from '~/selectors/map';

const getEffectiveScenery = (state) => {
  const scenery = getSceneryForThreeDView(state);
  if (scenery === 'auto') {
    return isShowIndoor(state) ? 'indoor' : 'outdoor';
  }
  return scenery;
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
  } = props;

  // 선택된 드론 정보 및 JSON에서 불러온 드론 구성
  const [selectedDrone, setSelectedDrone] = useState(null);
  const [droneConfig, setDroneConfig] = useState(null);
  const droneConfigRef = useRef(null);
  droneConfigRef.current = droneConfig;

  const collectConfigFromScene = () => {
    if (typeof document === 'undefined') {
      return { drones: [] };
    }

    const sceneEl = document.querySelector('a-scene');
    if (!sceneEl) {
      return { drones: [] };
    }

    const nodes = sceneEl.querySelectorAll('[data-drone-id]');
    const drones = Array.from(nodes).map((el, index) => {
      const id = el.getAttribute('data-drone-id') || `drone-${index + 1}`;
      const name = el.getAttribute('data-drone-name') || id;
      const batteryAttr = el.getAttribute('data-battery');
      const status = el.getAttribute('data-status') || 'Idle';
      const positionAttr = el.getAttribute('position');

      // A-Frame의 position 속성은 문자열("x y z") 또는 객체({x,y,z}) 둘 다 올 수 있으므로 둘 다 처리
      let pos = [0, 1, 1];
      if (positionAttr) {
        if (typeof positionAttr === 'string') {
          const [sx, sy, sz] = positionAttr.split(/\s+/);
          const nx = Number(sx);
          const ny = Number(sy);
          const nz = Number(sz);
          pos = [
            Number.isFinite(nx) ? nx : 0,
            Number.isFinite(ny) ? ny : 1,
            Number.isFinite(nz) ? nz : 1,
          ];
        } else if (typeof positionAttr === 'object') {
          const nx = Number(positionAttr.x);
          const ny = Number(positionAttr.y);
          const nz = Number(positionAttr.z);
          pos = [
            Number.isFinite(nx) ? nx : 0,
            Number.isFinite(ny) ? ny : 1,
            Number.isFinite(nz) ? nz : 1,
          ];
        }
      }

      let path = [];
      const pathAttr = el.getAttribute('data-path');
      if (pathAttr) {
        try {
          const parsed = JSON.parse(pathAttr);
          if (Array.isArray(parsed)) {
            path = parsed;
          }
        } catch (e) {
          // ignore
        }
      }

      const batteryNum = Number(batteryAttr);

      return {
        id,
        name,
        battery: Number.isFinite(batteryNum) ? batteryNum : 100,
        status,
        pos,
        path,
      };
    });

    return { drones };
  };

  // ✅ click-pick에서 dispatch 하는 이벤트 받기
  useEffect(() => {
    const onSelected = (e) => {
      const base = e.detail ?? null;
      if (!base) {
        setSelectedDrone(null);
        return;
      }

      const currentConfig = droneConfigRef.current;
      if (currentConfig && Array.isArray(currentConfig.drones)) {
        const found = currentConfig.drones.find((d) => d.id === base.id);
        if (found) {
          base.path = found.path || [];
        }
      }

      setSelectedDrone(base);
    };
    const onDeselected = () => {
      setSelectedDrone(null);
    };

    window.addEventListener('drone-selected', onSelected);
    window.addEventListener('drone-deselected', onDeselected);

    const onPathUpdated = (e) => {
      const { id, path } = e.detail || {};
      if (!id || !Array.isArray(path)) return;

      setDroneConfig((prev) => {
        const base =
          prev && Array.isArray(prev.drones) && prev.drones.length
            ? prev
            : collectConfigFromScene();

        if (!base || !Array.isArray(base.drones)) return base;

        const drones = base.drones.map((d) =>
          d.id === id ? { ...d, path: path.slice() } : d
        );
        return { ...base, drones };
      });
    };

    window.addEventListener('drone-path-updated', onPathUpdated);

    return () => {
      window.removeEventListener('drone-selected', onSelected);
      window.removeEventListener('drone-deselected', onDeselected);
      window.removeEventListener('drone-path-updated', onPathUpdated);
    };
  }, []);

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
        setDroneConfig(parsed);
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

    const configToSave = baseConfig && Array.isArray(baseConfig.drones)
      ? baseConfig
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
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const [pathProgress, setPathProgress] = useState(0);

  const handlePlayAll = () => {
    const base =
      droneConfig && Array.isArray(droneConfig.drones) && droneConfig.drones.length
        ? droneConfig
        : collectConfigFromScene();

    if (!base || !Array.isArray(base.drones) || !base.drones.length) return;

    const progress = Math.min(100, Math.max(0, Number(pathProgress) || 0)) / 100;

    base.drones.forEach((d) => {
      if (!Array.isArray(d.path) || !d.path.length || !d.id) return;

      const durations = d.path.map((p) => {
        const v = Number(p.durationMs);
        return Number.isFinite(v) && v > 0 ? v : 1000;
      });
      const total = durations.reduce((acc, v) => acc + v, 0);
      if (total <= 0) return;

      const targetTime = total * progress;
      let acc = 0;
      let startIndex = 0;
      for (let i = 0; i < durations.length; i += 1) {
        if (acc + durations[i] >= targetTime) {
          startIndex = i;
          break;
        }
        acc += durations[i];
      }

      const remainingPath = d.path.slice(startIndex);
      if (!remainingPath.length) return;

      window.dispatchEvent(
        new CustomEvent('drone-path-request', {
          detail: {
            id: d.id,
            points: remainingPath,
            durationPerSegment: 1000,
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
      if (!Array.isArray(d.pos) || d.pos.length < 3 || !d.id) return;

      const [px, py, pz] = d.pos;
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
          },
        })
      );
    });
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <input
        type="file"
        accept="application/json"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {/* Path / JSON 컨트롤 패널 */}
      <div
        style={{
          position: 'absolute',
          left: 8,
          bottom: 8,
          zIndex: 11000,
          padding: 8,
          borderRadius: 8,
          background: 'rgba(0,0,0,0.7)',
          color: 'white',
          fontSize: 12,
          minWidth: 260,
          maxWidth: 340,
        }}
      >
        <div style={{ marginBottom: 6, fontWeight: 600 }}>Path & JSON</div>
        <div style={{ marginBottom: 6 }}>
          <div style={{ marginBottom: 2 }}>재생 위치</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="range"
              min="0"
              max="100"
              value={pathProgress}
              onChange={(e) => setPathProgress(e.target.value)}
              style={{ flex: 1 }}
            />
            <span style={{ width: 32, textAlign: 'right' }}>{Math.round(pathProgress)}%</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, marginBottom: 4 }}>
          <button
            type="button"
            onClick={handlePlayAll}
            style={{
              flex: 1.4,
              padding: '4px 6px',
              borderRadius: 6,
              border: '1px solid rgba(255,255,255,0.4)',
              background: 'rgba(255,255,255,0.08)',
              color: 'white',
              cursor: 'pointer',
            }}
          >
            전체 재생
          </button>
          <button
            type="button"
            onClick={handleResetAll}
            style={{
              flex: 1,
              padding: '4px 6px',
              borderRadius: 6,
              border: '1px solid rgba(255,255,255,0.4)',
              background: 'rgba(255,255,255,0.12)',
              color: 'white',
              cursor: 'pointer',
            }}
          >
            원위치
          </button>
          <button
            type="button"
            onClick={handleLoadConfigClick}
            style={{
              flex: 0.9,
              padding: '4px 6px',
              borderRadius: 6,
              border: '1px solid rgba(255,255,255,0.4)',
              background: 'rgba(0,0,0,0.6)',
              color: 'white',
              cursor: 'pointer',
            }}
          >
            불러오기
          </button>
          <button
            type="button"
            onClick={handleSaveConfigClick}
            style={{
              flex: 0.9,
              padding: '4px 6px',
              borderRadius: 6,
              border: '1px solid rgba(255,255,255,0.4)',
              background: 'rgba(0,0,0,0.4)',
              color: 'white',
              cursor: 'pointer',
            }}
          >
            저장
          </button>
        </div>
      </div>
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
};

export default connect(
  (state) => ({
    isCoordinateSystemLeftHanded: isMapCoordinateSystemLeftHanded(state),
    ...state.settings.threeD,
    ...state.threeD,
    scenery: getEffectiveScenery(state),
    lighting: getLightingConditionsForThreeDView(state),
  }),
  {},
  null,
  { forwardRef: true }
)(ThreeDView);
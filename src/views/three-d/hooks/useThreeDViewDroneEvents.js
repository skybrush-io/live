import { useEffect } from 'react';

import { normalizeDroneForConfigIO } from '../utils/threeDViewUtils';

const sameDroneId = (a, b) => String(a) === String(b);

export default function useThreeDViewDroneEvents({
  droneConfigRef,
  setSelectedDrone,
  setDroneConfig,
  setPathProgress,
  collectConfigFromScene,
  showSpecDroneConfig,
}) {
  useEffect(() => {
    const applyGeneratedConfigToScene = (drones) => {
      if (typeof window === 'undefined' || !Array.isArray(drones) || !drones.length) return;

      // React 렌더로 엔티티 속성이 실제 DOM에 반영된 다음 브리지 이벤트를 보낸다.
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          drones.forEach((d) => {
            if (!d?.id) return;

            // path[0]이 곧 시작 위치. 없으면 기존 initialPos/pos로 fallback.
            const firstPathPoint = Array.isArray(d.path) && d.path.length > 0 ? d.path[0] : null;
            let pos = null;
            if (firstPathPoint) {
              const fx = Number(firstPathPoint.x);
              const fy = Number(firstPathPoint.y);
              const fz = Number(firstPathPoint.z);
              if (Number.isFinite(fx) && Number.isFinite(fy) && Number.isFinite(fz)) {
                pos = [fx, fy, fz];
              }
            }
            if (!pos) {
              pos = Array.isArray(d.initialPos) && d.initialPos.length >= 3 ? d.initialPos : d.pos;
            }

            if (Array.isArray(pos) && pos.length >= 3) {
              const x = Number(pos[0]);
              const y = Number(pos[1]);
              const z = Number(pos[2]);
              if (Number.isFinite(x) && Number.isFinite(y) && Number.isFinite(z)) {
                window.dispatchEvent(
                  new CustomEvent('drone-move-request', {
                    detail: { id: d.id, x, y, z },
                  })
                );
              }
            }

            if (Array.isArray(d.path) && d.path.length) {
              window.dispatchEvent(
                new CustomEvent('drone-path-updated', {
                  detail: { id: d.id, path: d.path },
                })
              );
            }
          });
        });
      });
    };

    const onSelected = (e) => {
      const base = e.detail ?? null;
      if (!base) {
        setSelectedDrone(null);
        return;
      }

      const currentConfig = droneConfigRef.current;
      if (currentConfig && Array.isArray(currentConfig.drones)) {
        const found = currentConfig.drones.find((d) => sameDroneId(d.id, base.id));
        if (found) {
          base.path = found.path || [];
          if (!base.initialPosition && Array.isArray(found.initialPos) && found.initialPos.length >= 3) {
            base.initialPosition = {
              x: Number(found.initialPos[0]) || 0,
              y: Number(found.initialPos[1]) || 0,
              z: Number(found.initialPos[2]) || 0,
            };
          }
        }
      }

      setSelectedDrone(base);
    };

    const onDeselected = () => {
      setSelectedDrone(null);
    };

    const onPathUpdated = (e) => {
      const { id, path } = e.detail || {};
      if (!id || !Array.isArray(path)) return;

      const hasShowSpec =
        showSpecDroneConfig &&
        Array.isArray(showSpecDroneConfig.drones) &&
        showSpecDroneConfig.drones.length > 0;

      setDroneConfig((prev) => {
        if (hasShowSpec) {
          const overrides = Array.isArray(prev?.drones) ? [...prev.drones] : [];
          const idx = overrides.findIndex((d) => sameDroneId(d.id, id));
          const entry = { id, path: path.slice() };
          if (idx >= 0) {
            overrides[idx] = { ...overrides[idx], ...entry };
          } else {
            overrides.push(entry);
          }
          return { ...(prev || {}), drones: overrides };
        }

        const base =
          prev && Array.isArray(prev.drones) && prev.drones.length
            ? prev
            : collectConfigFromScene();

        if (!base || !Array.isArray(base.drones)) return base;

        const drones = base.drones.map((d) =>
          sameDroneId(d.id, id) ? { ...d, path: path.slice() } : d
        );
        return { ...base, drones };
      });

      setSelectedDrone((prev) => {
        if (!prev || !sameDroneId(prev.id, id)) return prev;
        return { ...prev, path: path.slice() };
      });
    };

    const onInitialPosUpdated = (e) => {
      const { id, x, y, z } = e.detail || {};
      if (!id) return;
      const nx = Number(x);
      const ny = Number(y);
      const nz = Number(z);
      if (!Number.isFinite(nx) || !Number.isFinite(ny) || !Number.isFinite(nz)) return;

      setDroneConfig((prev) => {
        const base =
          prev && Array.isArray(prev.drones) && prev.drones.length
            ? prev
            : collectConfigFromScene();

        if (!base || !Array.isArray(base.drones)) return base;
        const drones = base.drones.map((d) => {
          if (!sameDroneId(d.id, id)) return d;
          const next = {
            ...d,
            initialPos: [nx, ny, nz],
            pos: Array.isArray(d.pos) ? d.pos : [0, 1, 1],
          };
          if (Array.isArray(d.path) && d.path.length > 0) {
            const first = d.path[0];
            next.path = [{ ...first, x: nx, y: ny, z: nz }, ...d.path.slice(1)];
          }
          return next;
        });
        return { ...base, drones };
      });

      setSelectedDrone((prev) => {
        if (!prev || !sameDroneId(prev.id, id)) return prev;
        const next = {
          ...prev,
          initialPosition: { x: nx, y: ny, z: nz },
        };
        if (Array.isArray(prev.path) && prev.path.length > 0) {
          const first = prev.path[0];
          next.path = [{ ...first, x: nx, y: ny, z: nz }, ...prev.path.slice(1)];
        }
        return next;
      });
    };

    const onDroneMoved = (e) => {
      const { id, x, y, z } = e.detail || {};
      if (!id) return;

      const nx = Number(x);
      const ny = Number(y);
      const nz = Number(z);
      if (!Number.isFinite(nx) || !Number.isFinite(ny) || !Number.isFinite(nz)) return;

      setSelectedDrone((prev) => {
        if (!prev || !sameDroneId(prev.id, id)) return prev;
        return {
          ...prev,
          currentPosition: { x: nx, y: ny, z: nz },
        };
      });
    };

    const onDroneStatusUpdated = (e) => {
      const { id, ...updates } = e.detail || {};
      if (!id) return;

      setSelectedDrone((prev) => {
        if (!prev || !sameDroneId(prev.id, id)) return prev;
        return {
          ...prev,
          ...updates,
        };
      });
    };

    const onDroneDeleteRequest = (e) => {
      const raw = e.detail?.id;
      if (raw === undefined || raw === null || String(raw).trim() === '') return;

      setDroneConfig((prev) => {
        const base =
          prev && Array.isArray(prev.drones) && prev.drones.length
            ? prev
            : collectConfigFromScene();

        if (!base || !Array.isArray(base.drones)) return base;

        const drones = base.drones.filter((d) => !sameDroneId(d.id, raw));
        return { ...base, drones };
      });

      setSelectedDrone((prev) => {
        if (prev && sameDroneId(prev.id, raw)) {
          queueMicrotask(() => {
            window.dispatchEvent(new CustomEvent('drone-deselected'));
          });
          return null;
        }
        return prev;
      });
    };

    const onPathGeneratorResponse = (e) => {
      const responseConfig = e?.detail;
      if (!responseConfig || !Array.isArray(responseConfig.drones)) return;

      const normalizedDrones = responseConfig.drones.map((d, index) => {
        const normalized = normalizeDroneForConfigIO(d, index);
        return {
          ...normalized,
          initialPos: normalized.initialPos.slice(),
        };
      });

      setPathProgress(0);
      setDroneConfig({ drones: normalizedDrones });
      setSelectedDrone(null);
      window.dispatchEvent(new CustomEvent('drone-deselected'));
      applyGeneratedConfigToScene(normalizedDrones);
    };

    window.addEventListener('drone-selected', onSelected);
    window.addEventListener('drone-deselected', onDeselected);
    window.addEventListener('drone-path-updated', onPathUpdated);
    window.addEventListener('drone-initial-pos-updated', onInitialPosUpdated);
    window.addEventListener('drone-moved', onDroneMoved);
    window.addEventListener('drone-status-updated', onDroneStatusUpdated);
    window.addEventListener('drone-delete-request', onDroneDeleteRequest);
    window.addEventListener('path-generator-response', onPathGeneratorResponse);

    return () => {
      window.removeEventListener('drone-selected', onSelected);
      window.removeEventListener('drone-deselected', onDeselected);
      window.removeEventListener('drone-path-updated', onPathUpdated);
      window.removeEventListener('drone-initial-pos-updated', onInitialPosUpdated);
      window.removeEventListener('drone-moved', onDroneMoved);
      window.removeEventListener('drone-status-updated', onDroneStatusUpdated);
      window.removeEventListener('drone-delete-request', onDroneDeleteRequest);
      window.removeEventListener('path-generator-response', onPathGeneratorResponse);
    };
  }, [
    collectConfigFromScene,
    droneConfigRef,
    setDroneConfig,
    setPathProgress,
    setSelectedDrone,
    showSpecDroneConfig,
  ]);
}

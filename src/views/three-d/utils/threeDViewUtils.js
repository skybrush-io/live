export const getEffectiveScenery = (state, getSceneryForThreeDView, isShowIndoor) => {
  const scenery = getSceneryForThreeDView(state);
  if (scenery === 'auto') {
    return isShowIndoor(state) ? 'indoor' : 'outdoor';
  }
  return scenery;
};

export const toFiniteDurationMs = (value, fallback = 1000) => {
  const n = Number(value);
  if (Number.isFinite(n) && n >= 0) return n;
  return fallback;
};

export const getPathTotalDurationMs = (path) => {
  if (!Array.isArray(path) || path.length < 2) return 0;
  let total = 0;
  for (let i = 1; i < path.length; i += 1) {
    total += toFiniteDurationMs(path[i]?.durationMs, 1000);
  }
  return total;
};

export const getInitialPointFromDrone = (drone) => {
  if (!drone || !Array.isArray(drone.pos) || drone.pos.length < 3) return null;
  const [px, py, pz] = drone.pos;
  const x = Number(px);
  const y = Number(py);
  const z = Number(pz);
  if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) return null;
  return { x, y, z, durationMs: 0 };
};

export const toFinitePoint = (point) => {
  if (!point) return null;
  const x = Number(point.x);
  const y = Number(point.y);
  const z = Number(point.z);
  if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) return null;
  return {
    x,
    y,
    z,
    durationMs: toFiniteDurationMs(point.durationMs, 1000),
  };
};

const almostEqual = (a, b) => Math.abs(Number(a) - Number(b)) < 1e-6;

export const parsePositionLike = (positionAttr, fallback = [0, 1, 1]) => {
  let pos = fallback;
  if (!positionAttr) return pos;

  if (Array.isArray(positionAttr) && positionAttr.length >= 3) {
    const nx = Number(positionAttr[0]);
    const ny = Number(positionAttr[1]);
    const nz = Number(positionAttr[2]);
    pos = [
      Number.isFinite(nx) ? nx : fallback[0],
      Number.isFinite(ny) ? ny : fallback[1],
      Number.isFinite(nz) ? nz : fallback[2],
    ];
  } else if (typeof positionAttr === 'string') {
    const [sx, sy, sz] = positionAttr.split(/\s+/);
    const nx = Number(sx);
    const ny = Number(sy);
    const nz = Number(sz);
    pos = [
      Number.isFinite(nx) ? nx : fallback[0],
      Number.isFinite(ny) ? ny : fallback[1],
      Number.isFinite(nz) ? nz : fallback[2],
    ];
  } else if (typeof positionAttr === 'object') {
    const nx = Number(positionAttr.x);
    const ny = Number(positionAttr.y);
    const nz = Number(positionAttr.z);
    pos = [
      Number.isFinite(nx) ? nx : fallback[0],
      Number.isFinite(ny) ? ny : fallback[1],
      Number.isFinite(nz) ? nz : fallback[2],
    ];
  }
  return pos;
};

export const buildSeekPathWithInitial = (drone) => {
  const initial = getInitialPointFromDrone(drone);
  const raw = Array.isArray(drone?.path) ? drone.path.map(toFinitePoint).filter(Boolean) : [];

  if (!initial) return raw;
  if (!raw.length) return [initial];

  const first = raw[0];
  const sameAsInitial =
    almostEqual(first.x, initial.x) &&
    almostEqual(first.y, initial.y) &&
    almostEqual(first.z, initial.z);

  if (sameAsInitial) return raw;
  return [initial, ...raw];
};

export const slicePathByProgress = (path, progressRatio) => {
  if (!Array.isArray(path) || path.length === 0) return [];
  if (path.length === 1) return [path[0]];

  const clamped = Math.min(1, Math.max(0, Number(progressRatio) || 0));
  if (clamped <= 0) return path.slice();

  const total = getPathTotalDurationMs(path);
  if (total <= 0) return path.slice();

  const targetMs = total * clamped;
  if (targetMs >= total) {
    const last = path[path.length - 1];
    return [{ ...last, durationMs: 0 }];
  }

  let acc = 0;
  for (let i = 1; i < path.length; i += 1) {
    const segMs = toFiniteDurationMs(path[i]?.durationMs, 1000);
    if (acc + segMs >= targetMs) {
      const from = path[i - 1];
      const to = path[i];
      const local = (targetMs - acc) / (segMs || 1);

      const startPoint = {
        x: Number(from.x) + (Number(to.x) - Number(from.x)) * local,
        y: Number(from.y) + (Number(to.y) - Number(from.y)) * local,
        z: Number(from.z) + (Number(to.z) - Number(from.z)) * local,
        durationMs: 0,
      };

      const firstRemainingMs = Math.max(0, Math.round(segMs * (1 - local)));
      const remaining = [{ ...to, durationMs: firstRemainingMs }];

      for (let j = i + 1; j < path.length; j += 1) {
        remaining.push({ ...path[j], durationMs: toFiniteDurationMs(path[j]?.durationMs, 1000) });
      }

      return [startPoint, ...remaining];
    }
    acc += segMs;
  }

  return path.slice(path.length - 1);
};

export const slicePathByElapsedMs = (path, elapsedMs) => {
  const total = getPathTotalDurationMs(path);
  if (total <= 0) return path.slice();
  const clampedMs = Math.min(total, Math.max(0, Number(elapsedMs) || 0));
  const ratio = clampedMs / total;
  return slicePathByProgress(path, ratio);
};

export const normalizeDroneForConfigIO = (drone, index = 0) => {
  const id = drone?.id || `drone-${index + 1}`;
  const name = drone?.name || id;
  const batteryNum = Number(drone?.battery);
  const status = drone?.status || 'Idle';

  const basePos = parsePositionLike(drone?.pos, [0, 1, 1]);

  return {
    id,
    name,
    battery: Number.isFinite(batteryNum) ? batteryNum : 100,
    status,
    pos: basePos,
    path: Array.isArray(drone?.path) ? drone.path : [],
  };
};

export const collectConfigFromScene = () => {
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
    const initialPosAttr = el.getAttribute('data-initial-pos');

    const pos = parsePositionLike(positionAttr, [0, 1, 1]);
    const initialPos = parsePositionLike(initialPosAttr, pos);

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
      initialPos,
      path,
    };
  });

  return { drones };
};

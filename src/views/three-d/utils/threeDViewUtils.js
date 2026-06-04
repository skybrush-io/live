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

export const toFiniteHoldMs = (value, fallback = 0) => {
  const n = Number(value);
  if (Number.isFinite(n) && n >= 0) return n;
  return fallback;
};

const segmentDurationMsForPlayback = (point, index, durationPerSegment) => {
  const parsed = Number(point?.durationMs);
  if (Number.isFinite(parsed) && parsed >= 0) return parsed;
  return index === 0 ? 0 : durationPerSegment;
};

const toFiniteYaw = (value) => {
  const yaw = Number(value);
  return Number.isFinite(yaw) ? yaw : null;
};

const normalizeYawDelta = (delta) => {
  let result = delta;
  while (result > 180) result -= 360;
  while (result < -180) result += 360;
  return result;
};

const interpolateYaw = (from, to, ratio) => (
  from + normalizeYawDelta(to - from) * ratio
);

export const toFiniteShowCoordinate = (coordinate) => {
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

const findSegmentForTimestamp = (points, timestampMs) => {
  if (!Array.isArray(points) || !points.length) return null;
  if (timestampMs <= points[0].timestampMs) {
    return { from: points[0], to: points[0], ratio: 0 };
  }

  const last = points[points.length - 1];
  if (timestampMs >= last.timestampMs) {
    return { from: last, to: last, ratio: 0 };
  }

  for (let i = 1; i < points.length; i += 1) {
    const from = points[i - 1];
    const to = points[i];
    if (timestampMs <= to.timestampMs) {
      const span = to.timestampMs - from.timestampMs;
      const ratio = span > 0 ? (timestampMs - from.timestampMs) / span : 0;
      return { from, to, ratio };
    }
  }

  return { from: last, to: last, ratio: 0 };
};

const getPositionAtTimestamp = (points, timestampMs) => {
  const segment = findSegmentForTimestamp(points, timestampMs);
  if (!segment) return null;
  const { from, to, ratio } = segment;
  return [
    Number(from.position[0]) + (Number(to.position[0]) - Number(from.position[0])) * ratio,
    Number(from.position[1]) + (Number(to.position[1]) - Number(from.position[1])) * ratio,
    Number(from.position[2]) + (Number(to.position[2]) - Number(from.position[2])) * ratio,
  ];
};

const getYawAtTimestamp = (points, timestampMs) => {
  const segment = findSegmentForTimestamp(points, timestampMs);
  if (!segment) return null;
  const fromYaw = toFiniteYaw(segment.from.yaw);
  const toYaw = toFiniteYaw(segment.to.yaw);
  if (fromYaw == null && toYaw == null) return null;
  if (fromYaw == null) return toYaw;
  if (toYaw == null) return fromYaw;
  return interpolateYaw(fromYaw, toYaw, segment.ratio);
};

const normalizeYawSetpoints = (yawControl, takeoffTimeMs) => {
  const setpoints = Array.isArray(yawControl?.setpoints) ? yawControl.setpoints : [];
  return setpoints
    .map((setpoint) => {
      if (!Array.isArray(setpoint) || setpoint.length < 2) return null;
      const yaw = toFiniteYaw(setpoint[1]);
      if (yaw == null) return null;
      const timestampMs = takeoffTimeMs + Math.max(0, Number(setpoint[0]) || 0) * 1000;
      return { timestampMs, yaw };
    })
    .filter(Boolean)
    .sort((a, b) => a.timestampMs - b.timestampMs);
};

export const makeShowLocalCoordinateTransformer = () => (coordinate) =>
  toFiniteShowCoordinate(coordinate);

/**
 * Converts show trajectory + yawControl into 3D editor playback path points.
 */
export const convertTrajectoryToPlaybackPath = (
  trajectory,
  transformCoordinate,
  initialCoordinate,
  yawControl
) => {
  if (!trajectory || !Array.isArray(trajectory.points) || !trajectory.points.length) {
    return null;
  }

  const transform = transformCoordinate || makeShowLocalCoordinateTransformer();
  const takeoffTimeMs = Math.max(0, Number(trajectory.takeoffTime) || 0) * 1000;
  const rawPoints = trajectory.points
    .map((keyframe) => {
      if (!Array.isArray(keyframe) || keyframe.length < 2) return null;
      const timestampMs = Math.max(0, Number(keyframe[0]) || 0) * 1000;
      const position = transform(keyframe[1]);
      if (!position) return null;
      return { timestampMs: takeoffTimeMs + timestampMs, position };
    })
    .filter(Boolean)
    .sort((a, b) => a.timestampMs - b.timestampMs);

  if (!rawPoints.length) return null;

  const yawPoints = normalizeYawSetpoints(yawControl, takeoffTimeMs);
  const timelineMs = Array.from(new Set([
    ...rawPoints.map((point) => Math.round(point.timestampMs)),
    ...yawPoints.map((point) => Math.round(point.timestampMs)),
  ])).sort((a, b) => a - b);

  const playbackPoints = timelineMs
    .map((timestampMs) => {
      const position = getPositionAtTimestamp(rawPoints, timestampMs);
      if (!position) return null;
      const point = { timestampMs, position };
      const yaw = getYawAtTimestamp(yawPoints, timestampMs);
      if (yaw != null) {
        point.yaw = yaw;
      }
      return point;
    })
    .filter(Boolean);

  if (!playbackPoints.length) return null;

  const transformedInitial = initialCoordinate ? transform(initialCoordinate) : null;
  const initialPos = transformedInitial || playbackPoints[0].position;
  const hasExplicitInitial = !!transformedInitial;
  const firstStartsAtInitial = almostEqualCoordinate(playbackPoints[0].position, initialPos);

  const path = playbackPoints.map((point, index) => {
    const durationMs =
      index === 0 && !hasExplicitInitial
        ? 0
        : index === 0
          ? Math.max(0, Math.round(firstStartsAtInitial ? 0 : point.timestampMs))
          : Math.max(0, Math.round(point.timestampMs - playbackPoints[index - 1].timestampMs));
    const [x, y, z] = point.position;
    const pathPoint = { x, y, z, durationMs };
    const yaw = toFiniteYaw(point.yaw);
    if (yaw != null) {
      pathPoint.yaw = yaw;
    }
    return pathPoint;
  });

  if (!hasExplicitInitial && playbackPoints[0].timestampMs > 0) {
    const [x, y, z] = playbackPoints[0].position;
    const waitPoint = {
      x,
      y,
      z,
      durationMs: Math.round(playbackPoints[0].timestampMs),
    };
    const yaw = toFiniteYaw(playbackPoints[0].yaw);
    if (yaw != null) {
      waitPoint.yaw = yaw;
    }
    path.splice(1, 0, waitPoint);
  }

  const landingTimeMs = Math.max(0, Number(trajectory.landingTime) || 0) * 1000;
  if (landingTimeMs > 0 && path.length > 0) {
    const lastIndex = path.length - 1;
    const last = path[lastIndex];
    path[lastIndex] = {
      ...last,
      holdMs: (Number.isFinite(Number(last.holdMs)) && Number(last.holdMs) > 0
        ? Number(last.holdMs)
        : 0) + landingTimeMs,
    };
  }

  return { initialPos, path };
};

/** Accepts drones[] or path-planner style drones: { "drone-1": { trajectory, yawControl } }. */
export const normalizeDronesFromConfigImport = (parsed, { transformCoordinate } = {}) => {
  const dronesRaw = parsed?.drones;
  if (!dronesRaw) return [];

  const list = Array.isArray(dronesRaw)
    ? dronesRaw
    : Object.entries(dronesRaw).map(([id, drone]) => ({
        id,
        ...(drone && typeof drone === 'object' ? drone : {}),
      }));

  const transform = transformCoordinate || makeShowLocalCoordinateTransformer();

  return list.map((drone, index) => {
    const rawId = drone?.id;
    const id =
      rawId !== undefined && rawId !== null && String(rawId).trim() !== ''
        ? String(rawId)
        : `drone-${index + 1}`;

    if (Array.isArray(drone?.path) && drone.path.length > 0) {
      return { ...drone, id };
    }

    const trajectory = drone?.settings?.trajectory ?? drone?.trajectory;
    const yawControl = drone?.settings?.yawControl ?? drone?.yawControl;
    const home = drone?.settings?.home ?? drone?.home;
    const converted = convertTrajectoryToPlaybackPath(
      trajectory,
      transform,
      home,
      yawControl
    );

    if (!converted) {
      return { ...drone, id };
    }

    return {
      ...drone,
      id,
      initialPos: converted.initialPos,
      path: converted.path,
      yaw:
        converted.path.length > 0 && Number.isFinite(Number(converted.path[0].yaw))
          ? Number(converted.path[0].yaw)
          : 0,
    };
  });
};

/**
 * Returns how long drone-move-bridge will take to play a path (ms).
 * Mirrors startFromInitial playback in drone-move-bridge.js.
 */
export const getPathPlaybackDurationMs = (
  path,
  { startFromInitial = true, durationPerSegment = 1000 } = {}
) => {
  if (!Array.isArray(path) || path.length === 0) return 0;

  const defaultDur =
    Number.isFinite(Number(durationPerSegment)) && Number(durationPerSegment) > 0
      ? Number(durationPerSegment)
      : 1000;

  const holdMs = (point) => toFiniteHoldMs(point?.holdMs, 0);

  if (!startFromInitial) {
    let total = 0;
    for (let i = 0; i < path.length; i += 1) {
      total += segmentDurationMsForPlayback(path[i], i, defaultDur) + holdMs(path[i]);
    }
    return total;
  }

  const first = path[0] || {};
  const firstX = Number(first.x);
  const firstY = Number(first.y);
  const firstZ = Number(first.z);
  const hasValidFirst =
    Number.isFinite(firstX) && Number.isFinite(firstY) && Number.isFinite(firstZ);

  if (!hasValidFirst) {
    let total = 0;
    for (let i = 0; i < path.length; i += 1) {
      total += segmentDurationMsForPlayback(path[i], i, defaultDur) + holdMs(path[i]);
    }
    return total;
  }

  const firstDur = Number(first.durationMs);
  const firstHold = Number(first.holdMs);
  let total =
    (Number.isFinite(firstDur) && firstDur > 0 ? firstDur : 0) +
    (Number.isFinite(firstHold) && firstHold > 0 ? firstHold : 0);

  for (let i = 1; i < path.length; i += 1) {
    total += segmentDurationMsForPlayback(path[i], i, defaultDur) + holdMs(path[i]);
  }
  return total;
};

/** Sum of segment durations; uses the same rules as path playback. */
export const getPathTotalDurationMs = (path, options) =>
  getPathPlaybackDurationMs(path, { startFromInitial: true, durationPerSegment: 1000, ...options });

/**
 * Cumulative arrival time (ms) at each path point when playing with startFromInitial.
 * Mirrors drone-move-bridge.js snap-to-first-point + segment/hold sequencing.
 */
export const getPathPointArrivalTimesMs = (
  path,
  { startFromInitial = true, durationPerSegment = 1000 } = {}
) => {
  if (!Array.isArray(path) || path.length === 0) return [];

  const defaultDur =
    Number.isFinite(Number(durationPerSegment)) && Number(durationPerSegment) > 0
      ? Number(durationPerSegment)
      : 1000;

  if (!startFromInitial) {
    const times = [];
    let acc = 0;
    for (let i = 0; i < path.length; i += 1) {
      times[i] = acc;
      acc +=
        segmentDurationMsForPlayback(path[i], i, defaultDur) + toFiniteHoldMs(path[i]?.holdMs, 0);
    }
    return times;
  }

  const times = [0];
  if (path.length === 1) return times;

  const first = path[0] || {};
  const firstDur = Number(first.durationMs);
  const firstHold = Number(first.holdMs);
  let acc =
    (Number.isFinite(firstDur) && firstDur > 0 ? firstDur : 0) +
    (Number.isFinite(firstHold) && firstHold > 0 ? firstHold : 0);

  for (let i = 1; i < path.length; i += 1) {
    acc += segmentDurationMsForPlayback(path[i], i, defaultDur);
    times[i] = acc;
    acc += toFiniteHoldMs(path[i]?.holdMs, 0);
  }

  return times;
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

export const toFinitePoint = (point, { isFirst = false } = {}) => {
  if (!point) return null;
  const x = Number(point.x);
  const y = Number(point.y);
  const z = Number(point.z);
  if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) return null;
  const normalized = {
    x,
    y,
    z,
    durationMs: toFiniteDurationMs(point.durationMs, isFirst ? 0 : 1000),
    holdMs: toFiniteHoldMs(point.holdMs, 0),
  };
  const yaw = toFiniteYaw(point.yaw);
  if (yaw != null) {
    normalized.yaw = yaw;
  }
  if (point.highlighted) {
    normalized.highlighted = true;
  }
  return normalized;
};

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

  // path[0] is the start position. Do not prepend drone.pos / initialPos before it.
  if (raw.length) return raw;
  return initial ? [initial] : [];
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
  for (let i = 0; i < path.length; i += 1) {
    const segMs = segmentDurationMsForPlayback(path[i], i, 1000);
    const holdMs = toFiniteHoldMs(path[i]?.holdMs, 0);
    if (i === 0) {
      if (acc + segMs + holdMs >= targetMs) {
        const remainingWaitMs = Math.max(0, Math.round(acc + segMs + holdMs - targetMs));
        return [{ ...path[0], durationMs: remainingWaitMs, holdMs: 0 }, ...path.slice(1)];
      }
      acc += segMs + holdMs;
      continue;
    }

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
      const fromYaw = toFiniteYaw(from.yaw);
      const toYaw = toFiniteYaw(to.yaw);
      if (fromYaw != null && toYaw != null) {
        startPoint.yaw = interpolateYaw(fromYaw, toYaw, local);
      } else if (fromYaw != null) {
        startPoint.yaw = fromYaw;
      } else if (toYaw != null) {
        startPoint.yaw = toYaw;
      }

      const firstRemainingMs = Math.max(0, Math.round(segMs * (1 - local)));
      const remaining = [{ ...to, durationMs: firstRemainingMs, holdMs }];

      for (let j = i + 1; j < path.length; j += 1) {
        remaining.push({
          ...path[j],
          durationMs: segmentDurationMsForPlayback(path[j], j, 1000),
          holdMs: toFiniteHoldMs(path[j]?.holdMs, 0),
        });
      }

      return [startPoint, ...remaining];
    }
    acc += segMs;

    if (holdMs > 0) {
      if (acc + holdMs >= targetMs) {
        const remainingHoldMs = Math.max(0, Math.round(acc + holdMs - targetMs));
        const remaining = [{ ...path[i], durationMs: 0, holdMs: remainingHoldMs }];

        for (let j = i + 1; j < path.length; j += 1) {
          remaining.push({
            ...path[j],
            durationMs: segmentDurationMsForPlayback(path[j], j, 1000),
            holdMs: toFiniteHoldMs(path[j]?.holdMs, 0),
          });
        }

        return remaining;
      }
      acc += holdMs;
    }
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

/** Stable fingerprint for show-spec drone paths (detect .skyc reload). */
export const fingerprintShowSpecDroneConfig = (config) => {
  if (!config || !Array.isArray(config.drones) || !config.drones.length) {
    return '';
  }
  return config.drones
    .map((d) => {
      const path = Array.isArray(d.path) ? d.path : [];
      const head = path[0];
      const tail = path[path.length - 1];
      const headKey = head
        ? `${head.x},${head.y},${head.z},${head.durationMs},${head.holdMs},${head.yaw}`
        : '';
      const tailKey = tail
        ? `${tail.x},${tail.y},${tail.z},${tail.durationMs},${tail.holdMs},${tail.yaw}`
        : '';
      return `${d.id}:${path.length}:${headKey}:${tailKey}`;
    })
    .join('|');
};

/** Push drone paths/positions into the A-Frame bridge after React has rendered. */
export const applyDronePathsToScene = (drones) => {
  if (typeof window === 'undefined' || !Array.isArray(drones) || !drones.length) {
    return;
  }

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      drones.forEach((d) => {
        if (!d?.id) return;

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
            const detail = { id: d.id, x, y, z };
            const yaw = toFiniteYaw(firstPathPoint?.yaw ?? d.yaw);
            if (yaw != null) {
              detail.yaw = yaw;
            }
            window.dispatchEvent(new CustomEvent('drone-move-request', { detail }));
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

/** Apply per-drone path overrides (e.g. highlight flags) onto a base drone list. */
/** Dispatched before SKYC export so open path editors flush pending edits. */
export const DRONE_PATH_FLUSH_REQUEST = 'drone-path-flush-request';

export const getInitialPositionForPathDelivery = (drone) => {
  const first = Array.isArray(drone?.path) ? drone.path[0] : null;
  if (first) {
    const x = Number(first.x);
    const y = Number(first.y);
    const z = Number(first.z);
    if (Number.isFinite(x) && Number.isFinite(y) && Number.isFinite(z)) {
      return [x, y, z];
    }
  }
  return parsePositionLike(drone?.initialPos, [0, 1, 1]);
};

export const buildPathDeliveryPayloadFromConfig = (baseConfig) => {
  const drones = Array.isArray(baseConfig?.drones) ? baseConfig.drones : [];
  return {
    drones: drones
      .map((d, index) => normalizeDroneForConfigIO(d, index))
      .filter((d) => d.id && Array.isArray(d.path) && d.path.length)
      .map((d) => ({
        id: d.id,
        initial_position: getInitialPositionForPathDelivery(d),
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

export const mergePathOverridesIntoDrones = (baseDrones, overrideDrones) => {
  if (!Array.isArray(baseDrones) || !baseDrones.length) {
    return Array.isArray(baseDrones) ? baseDrones : [];
  }
  if (!Array.isArray(overrideDrones) || !overrideDrones.length) {
    return baseDrones;
  }

  const pathById = new Map();
  overrideDrones.forEach((d) => {
    if (d?.id == null || !Array.isArray(d.path)) return;
    pathById.set(String(d.id), d.path);
  });

  if (!pathById.size) return baseDrones;

  const mergePathPointWithYawFallback = (basePoint, overridePoint) => {
    const merged = { ...overridePoint };
    const overrideYaw = Number(overridePoint?.yaw);
    if (Number.isFinite(overrideYaw)) return merged;
    const baseYaw = Number(basePoint?.yaw);
    if (Number.isFinite(baseYaw)) {
      merged.yaw = baseYaw;
    }
    return merged;
  };

  const mergePathWithYawFallback = (basePath, overridePath) => {
    if (!Array.isArray(overridePath)) return basePath;
    return overridePath.map((overridePoint, index) =>
      mergePathPointWithYawFallback(basePath?.[index], overridePoint)
    );
  };

  return baseDrones.map((d) => {
    const overridePath = pathById.get(String(d?.id));
    return overridePath
      ? { ...d, path: mergePathWithYawFallback(d?.path, overridePath) }
      : d;
  });
};

export const normalizeDroneForConfigIO = (drone, index = 0) => {
  const rawId = drone?.id;
  const id =
    rawId !== undefined && rawId !== null && String(rawId).trim() !== ''
      ? String(rawId)
      : `drone-${index + 1}`;
  const name = drone?.name || id;
  const batteryNum = Number(drone?.battery);
  const status = drone?.status || 'Idle';
  const path = Array.isArray(drone?.path)
    ? drone.path.map((p, index) => toFinitePoint(p, { isFirst: index === 0 })).filter(Boolean)
    : [];
  const firstPathPoint = path[0];

  const fallbackPos = firstPathPoint
    ? [firstPathPoint.x, firstPathPoint.y, firstPathPoint.z]
    : [0, 1, 1];
  const rawInitialPos = drone?.initialPos ?? drone?.initial_position ?? drone?.pos;
  const initialPos = parsePositionLike(rawInitialPos, fallbackPos);
  const basePos = firstPathPoint ? fallbackPos : parsePositionLike(drone?.pos, initialPos);

  return {
    id,
    name,
    battery: Number.isFinite(batteryNum) ? batteryNum : 100,
    status,
    pos: basePos,
    initialPos,
    path,
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
      } catch {
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

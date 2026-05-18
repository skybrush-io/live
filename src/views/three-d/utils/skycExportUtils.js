import { Base64 } from 'js-base64';
import JSZip from 'jszip';

import { getPathPointArrivalTimesMs, toFiniteHoldMs } from './threeDViewUtils';

const MS_TO_SEC = 0.001;
const TIME_ROUND_DECIMALS = 6;

const roundSeconds = (value) => {
  const factor = 10 ** TIME_ROUND_DECIMALS;
  return Math.round(value * factor) / factor;
};

const isObjectCoordinate = (value) =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

const normalizeCoordinate = (coord, defaultZ = 0) => {
  if (isObjectCoordinate(coord)) {
    const x = Number(coord.x);
    const y = Number(coord.y);
    let z = Number(coord.z);
    if (!Number.isFinite(z)) {
      z = defaultZ;
    }
    if (Number.isFinite(x) && Number.isFinite(y) && Number.isFinite(z)) {
      return { x, y, z };
    }
    return null;
  }

  if (!Array.isArray(coord)) {
    return null;
  }

  const x = Number(coord[0]);
  const y = Number(coord[1]);
  let z = coord.length >= 3 ? Number(coord[2]) : defaultZ;
  if (!Number.isFinite(z)) {
    z = defaultZ;
  }
  if (Number.isFinite(x) && Number.isFinite(y)) {
    return { x, y, z };
  }
  return null;
};

const formatCoordinate = (coord, template) => {
  if (!coord) return null;
  if (isObjectCoordinate(template)) {
    return { x: coord.x, y: coord.y, z: coord.z };
  }
  return [coord.x, coord.y, coord.z];
};

const isNumericTuple = (value) =>
  Array.isArray(value) && value.length > 0 && value.every((item) => typeof item === 'number');

const normalizeControlPoints = (thirdElement, defaultZ, templateControlPoint) => {
  if (thirdElement == null) {
    return [];
  }

  if (!Array.isArray(thirdElement) || thirdElement.length === 0) {
    return [];
  }

  if (isNumericTuple(thirdElement)) {
    const single = normalizeCoordinate(thirdElement, defaultZ);
    return single ? [formatCoordinate(single, templateControlPoint)] : [];
  }

  return thirdElement
    .map((controlPoint) => {
      const parsed = normalizeCoordinate(controlPoint, defaultZ);
      return parsed ? formatCoordinate(parsed, templateControlPoint ?? controlPoint) : null;
    })
    .filter(Boolean);
};

const getPositionTemplate = (trajectory) => trajectory?.points?.[0]?.[1];

const getControlPointTemplate = (trajectory) => {
  const controls = trajectory?.points?.[0]?.[2];
  if (!Array.isArray(controls) || !controls.length) {
    return undefined;
  }
  if (isNumericTuple(controls)) {
    return controls;
  }
  return controls[0];
};

const pathPointToCoordinate = (point, template, defaultZ = 0) => {
  const fromPath = normalizeCoordinate(
    { x: point?.x, y: point?.y, z: point?.z },
    defaultZ
  );
  return fromPath ? formatCoordinate(fromPath, template) : null;
};

/**
 * Patches trajectory points/timing only, keeping formation-plan / path-planner shape:
 *   [time, [x,y,z], controlPoints]  (controlPoints is [] when unused)
 */
export const patchTrajectoryFromPath = (originalTrajectory, path) => {
  if (!originalTrajectory || !Array.isArray(path) || !path.length) {
    return null;
  }

  const originalPoints = Array.isArray(originalTrajectory.points) ? originalTrajectory.points : [];
  const takeoffTime = Math.max(0, Number(originalTrajectory.takeoffTime) || 0);
  const takeoffTimeMs = takeoffTime * 1000;
  const arrivalTimesMs = getPathPointArrivalTimesMs(path);
  const positionTemplate = getPositionTemplate(originalTrajectory);
  const controlTemplate = getControlPointTemplate(originalTrajectory);

  const lastIndex = path.length - 1;
  const landingTimeSec = roundSeconds(toFiniteHoldMs(path[lastIndex]?.holdMs, 0) * MS_TO_SEC);

  const points = [];
  for (let i = 0; i < path.length; i += 1) {
    const origKf = originalPoints[i];
    const pointTemplate = origKf?.[1] ?? positionTemplate;
    const defaultZ = normalizeCoordinate(pointTemplate)?.z ?? 0;
    const position = pathPointToCoordinate(path[i], pointTemplate, defaultZ);
    if (!position) continue;

    const timeSec = roundSeconds(
      Math.max(0, ((Number(arrivalTimesMs[i]) || 0) - takeoffTimeMs) * MS_TO_SEC)
    );

    const pointControlTemplate =
      (Array.isArray(origKf?.[2]) && !isNumericTuple(origKf[2]) ? origKf[2][0] : origKf?.[2]) ??
      controlTemplate;

    const controls = normalizeControlPoints(origKf?.[2], defaultZ, pointControlTemplate);

    points.push([timeSec, position, controls]);
  }

  if (!points.length) {
    return null;
  }

  for (let i = 1; i < points.length; i += 1) {
    if (points[i][0] <= points[i - 1][0]) {
      points[i][0] = roundSeconds(points[i - 1][0] + MS_TO_SEC);
    }
  }

  const patched = {
    ...originalTrajectory,
    version: originalTrajectory.version ?? 1,
    points,
  };

  if (takeoffTime > 0 || originalTrajectory.takeoffTime !== undefined) {
    patched.takeoffTime = takeoffTime;
  }
  if (landingTimeSec > 0 || originalTrajectory.landingTime !== undefined) {
    patched.landingTime = landingTimeSec;
  } else if ('landingTime' in originalTrajectory && landingTimeSec === 0) {
    delete patched.landingTime;
  }

  return patched;
};

const getTrajectoryRefPath = (drone) => {
  const trajectory = drone?.settings?.trajectory;
  if (trajectory && typeof trajectory.$ref === 'string') {
    const ref = trajectory.$ref.split('#')[0];
    return ref.replace(/^\.\//, '');
  }
  return null;
};

const findZipFile = (zip, path) => {
  if (!path) return null;
  const direct = zip.file(path);
  if (direct) return direct;
  const decoded = decodeURIComponent(path);
  if (decoded !== path) {
    return zip.file(decoded);
  }
  return null;
};

const loadOriginalTrajectory = async (zip, zipDrone, specDrone) => {
  const specTrajectory = specDrone?.settings?.trajectory;
  if (specTrajectory && Array.isArray(specTrajectory.points) && !specTrajectory.$ref) {
    return specTrajectory;
  }

  const refPath = getTrajectoryRefPath(zipDrone);
  if (refPath) {
    const refFile = findZipFile(zip, refPath);
    if (refFile) {
      return JSON.parse(await refFile.async('string'));
    }
  }

  const inline = zipDrone?.settings?.trajectory;
  if (inline && Array.isArray(inline.points) && !inline.$ref) {
    return inline;
  }

  return specTrajectory;
};

/**
 * Patches only trajectory JSON inside the original .skyc zip.
 * show.json fields (home, coordinateSystem, lights, geofence, cues) are left as-is.
 */
export const patchSkycZipWithTrajectories = async ({
  base64Blob,
  swarmDrones,
  editedDrones,
}) => {
  if (!base64Blob) {
    throw new Error('원본 .skyc 데이터가 없습니다. 파일을 다시 업로드해 주세요.');
  }

  const zip = await JSZip.loadAsync(Base64.toUint8Array(base64Blob));
  const showFile = zip.file('show.json');
  if (!showFile) {
    throw new Error('show.json을 찾을 수 없습니다.');
  }

  const showRoot = JSON.parse(await showFile.async('string'));
  const zipDrones = showRoot?.swarm?.drones;
  if (!Array.isArray(zipDrones) || !zipDrones.length) {
    throw new Error('show.json에 드론 swarm이 없습니다.');
  }

  const specDrones = Array.isArray(swarmDrones) ? swarmDrones : [];
  const pathsByIndex = Array.isArray(editedDrones) ? editedDrones : [];
  let patchedCount = 0;
  let showJsonTouched = false;

  for (let i = 0; i < zipDrones.length; i += 1) {
    const edited = pathsByIndex[i];
    if (!edited || !Array.isArray(edited.path) || !edited.path.length) {
      continue;
    }

    const zipDrone = zipDrones[i];
    const specDrone = specDrones[i];
    const refPath = getTrajectoryRefPath(zipDrone);
    const originalTrajectory = await loadOriginalTrajectory(zip, zipDrone, specDrone);
    const patchedTrajectory = patchTrajectoryFromPath(originalTrajectory, edited.path);

    if (!patchedTrajectory) {
      continue;
    }

    if (refPath) {
      const refFile = findZipFile(zip, refPath);
      if (!refFile) {
        throw new Error(`trajectory 파일을 찾을 수 없습니다: ${refPath}`);
      }
      zip.file(refPath, JSON.stringify(patchedTrajectory));
    } else if (zipDrone?.settings) {
      zipDrone.settings.trajectory = patchedTrajectory;
      showJsonTouched = true;
    }

    patchedCount += 1;
  }

  if (!patchedCount) {
    throw new Error('갱신할 유효한 경로가 없습니다.');
  }

  if (showJsonTouched) {
    zip.file('show.json', JSON.stringify(showRoot));
  }

  return zip.generateAsync({ type: 'blob' });
};

export const downloadBlobAsFile = (blob, filename) => {
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  if (anchor.parentNode === document.body) {
    try {
      document.body.removeChild(anchor);
    } catch (error) {
      if (error?.name !== 'NotFoundError') throw error;
    }
  }
  URL.revokeObjectURL(objectUrl);
};

export const exportPatchedSkycFromShow = async ({
  base64Blob,
  swarmDrones,
  editedDrones,
  filename = 'updated-show.skyc',
}) => {
  const blob = await patchSkycZipWithTrajectories({
    base64Blob,
    swarmDrones,
    editedDrones,
  });
  downloadBlobAsFile(blob, filename);
  return blob;
};

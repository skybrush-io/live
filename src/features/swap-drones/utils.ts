import type { TFunction } from 'i18next';
import isNil from 'lodash-es/isNil';

import type { MissionIndex } from '~/model/missions';
import type { Identifier } from '~/utils/collections';
import { formatMissionId, parseMissionId } from '~/utils/formatting';
import type { Nullable } from '~/utils/types';

import type { PreviewState, ResolvedDrone } from './types';

export const emptySlot = () => ({
  filterText: '',
  resolved: null,
});

export const droneRef = (drone: ResolvedDrone): string =>
  drone.missionIndex === null
    ? drone.uavId
    : `${drone.uavId}/${formatMissionId(drone.missionIndex)}`;

export const isShowIdFilter = (filter: string): boolean =>
  filter.trim().toLowerCase().startsWith('s');

export const selectionLabel = (
  item: { missionIndex?: MissionIndex; uavId?: Identifier },
  filter: string
): string => {
  if (isShowIdFilter(filter) && item.missionIndex !== undefined) {
    return formatMissionId(item.missionIndex);
  }

  return item.uavId ?? '';
};

/**
 * Resolves a typed/selected value to an online physical UAV.
 * Show-ID lookup must hit a filled slot of the current mission mapping.
 */
export const resolveDrone = (
  query: string,
  onlineUavIds: readonly Identifier[],
  mapping: ReadonlyArray<Nullable<Identifier>>,
  reverseMapping: Readonly<Record<string, MissionIndex>>
): ResolvedDrone | null => {
  const trimmed = query.trim();
  if (!trimmed) {
    return null;
  }

  const missionIndex = parseMissionId(trimmed);
  if (missionIndex !== undefined) {
    if (missionIndex >= mapping.length) {
      return null;
    }

    const uavId = mapping[missionIndex];
    if (isNil(uavId) || !onlineUavIds.includes(uavId)) {
      return null;
    }

    return { uavId, missionIndex };
  }

  const matchedUavId = onlineUavIds.find(
    (id) => id.toLowerCase() === trimmed.toLowerCase()
  );
  if (!matchedUavId) {
    return null;
  }

  return {
    uavId: matchedUavId,
    missionIndex: reverseMapping[matchedUavId] ?? null,
  };
};

export const buildPreview = (
  drone1: ResolvedDrone | null,
  drone2: ResolvedDrone | null,
  blocked: boolean,
  t: TFunction
): PreviewState => {
  if (blocked) {
    return {
      kind: 'blocked',
      message: t('swapDronesDialog.preview.blocked'),
    };
  }

  if (!drone1 || !drone2) {
    return {
      kind: 'placeholder',
      message: t('swapDronesDialog.preview.selectTwoDrones'),
    };
  }

  if (drone1.uavId === drone2.uavId) {
    return {
      kind: 'warning',
      message: t('swapDronesDialog.preview.sameDrone'),
    };
  }

  const mapped1 = drone1.missionIndex !== null;
  const mapped2 = drone2.missionIndex !== null;

  if (!mapped1 && !mapped2) {
    return {
      kind: 'warning',
      message: t('swapDronesDialog.preview.bothUnmapped'),
    };
  }

  if (mapped1 && mapped2) {
    return {
      kind: 'ready',
      lines: [
        {
          i18nKey: 'swapDronesDialog.preview.movedToShowId',
          badges: {
            drone: { label: droneRef(drone1) },
            slot: { label: formatMissionId(drone2.missionIndex!), color: 'slot' },
          },
        },
        {
          i18nKey: 'swapDronesDialog.preview.movedToShowId',
          badges: {
            drone: { label: droneRef(drone2) },
            slot: { label: formatMissionId(drone1.missionIndex!), color: 'slot' },
          },
        },
        {
          i18nKey: 'swapDronesDialog.preview.uploadToDrones',
          badges: {
            drone1: { label: droneRef(drone1) },
            drone2: { label: droneRef(drone2) },
          },
        },
      ],
    };
  }

  const mapped = mapped1 ? drone1 : drone2;
  const spare = mapped1 ? drone2 : drone1;

  return {
    kind: 'ready',
    lines: [
      {
        i18nKey: 'swapDronesDialog.preview.removedFromMapping',
        badges: {
          drone: { label: droneRef(mapped), color: 'removed' },
        },
      },
      {
        i18nKey: 'swapDronesDialog.preview.addedWithShowId',
        badges: {
          drone: { label: droneRef(spare), color: 'added' },
          slot: {
            label: formatMissionId(mapped.missionIndex!),
            color: 'slot',
          },
        },
      },
      {
        i18nKey: 'swapDronesDialog.preview.uploadToDrone',
        badges: {
          drone: { label: droneRef(spare), color: 'added' },
        },
      },
    ],
  };
};

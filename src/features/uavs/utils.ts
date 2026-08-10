import type { TFunction } from 'i18next';
import isNil from 'lodash-es/isNil';

import type { MissionIndex } from '~/model/missions';
import type { Identifier } from '~/utils/collections';
import { formatMissionId, parseMissionId } from '~/utils/formatting';
import type { Nullable } from '~/utils/types';

export type SwapResolvedDrone = {
  missionIndex: MissionIndex | null;
  uavId: Identifier;
};

export type SwapSlotState = {
  filterText: string;
  resolved: SwapResolvedDrone | null;
};

export type SwapPreviewBadgeColor = 'added' | 'removed' | 'slot';

export type SwapPreviewBadge = {
  color?: SwapPreviewBadgeColor;
  label: string;
};

export type SwapPreviewLine = {
  badges: Record<string, SwapPreviewBadge>;
  i18nKey: string;
};

export type SwapPreviewState =
  | { kind: 'blocked'; message: string }
  | { kind: 'placeholder'; message: string }
  | { kind: 'ready'; lines: SwapPreviewLine[] }
  | { kind: 'warning'; message: string };

export const emptySwapSlot = () => ({
  filterText: '',
  resolved: null,
});

export const swapDroneRef = (drone: SwapResolvedDrone): string =>
  drone.missionIndex === null
    ? drone.uavId
    : `${drone.uavId}/${formatMissionId(drone.missionIndex)}`;

export const isSwapShowIdFilter = (filter: string): boolean =>
  filter.trim().toLowerCase().startsWith('s');

export const swapSelectionLabel = (
  item: { missionIndex?: MissionIndex; uavId?: Identifier },
  filter: string
): string => {
  if (isSwapShowIdFilter(filter) && item.missionIndex !== undefined) {
    return formatMissionId(item.missionIndex);
  }

  return item.uavId ?? '';
};

/**
 * Resolves a typed/selected value to an online physical UAV.
 * Show-ID lookup must hit a filled slot of the current mission mapping.
 */
export const resolveSwapDrone = (
  query: string,
  onlineUavIds: readonly Identifier[],
  mapping: ReadonlyArray<Nullable<Identifier>>,
  reverseMapping: Readonly<Record<string, MissionIndex>>
): SwapResolvedDrone | null => {
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

export const buildSwapPreview = (
  drone1: SwapResolvedDrone | null,
  drone2: SwapResolvedDrone | null,
  blocked: boolean,
  t: TFunction
): SwapPreviewState => {
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
            drone: { label: swapDroneRef(drone1) },
            slot: {
              label: formatMissionId(drone2.missionIndex!),
              color: 'slot',
            },
          },
        },
        {
          i18nKey: 'swapDronesDialog.preview.movedToShowId',
          badges: {
            drone: { label: swapDroneRef(drone2) },
            slot: {
              label: formatMissionId(drone1.missionIndex!),
              color: 'slot',
            },
          },
        },
        {
          i18nKey: 'swapDronesDialog.preview.uploadToDrones',
          badges: {
            drone1: { label: swapDroneRef(drone1) },
            drone2: { label: swapDroneRef(drone2) },
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
          drone: { label: swapDroneRef(mapped), color: 'removed' },
        },
      },
      {
        i18nKey: 'swapDronesDialog.preview.addedWithShowId',
        badges: {
          drone: { label: swapDroneRef(spare), color: 'added' },
          slot: {
            label: formatMissionId(mapped.missionIndex!),
            color: 'slot',
          },
        },
      },
      {
        i18nKey: 'swapDronesDialog.preview.uploadToDrone',
        badges: {
          drone: { label: swapDroneRef(spare), color: 'added' },
        },
      },
    ],
  };
};

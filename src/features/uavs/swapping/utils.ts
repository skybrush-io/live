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

export type SwapFieldSide = 'left' | 'right';

export type SwapPreviewBadgeColor = SwapFieldSide;

export const swapFieldAccentColor = (side: SwapFieldSide) =>
  side === 'left' ? 'warning.main' : 'success.main';

export const swapFieldAccentSx = (side: SwapFieldSide) => {
  const accent = swapFieldAccentColor(side);

  return {
    '& .MuiFilledInput-root': {
      '&::before': {
        borderBottom: '3px solid',
        borderBottomColor: accent,
      },
      '&::after': {
        borderBottom: '3px solid',
        borderBottomColor: accent,
      },
      '&:hover:not(.Mui-disabled)::before': {
        borderBottomColor: accent,
      },
      '&.Mui-focused::after': {
        borderBottomColor: accent,
      },
    },
  };
};

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

export type SwapQueuedPair = {
  drone1: SwapResolvedDrone;
  drone2: SwapResolvedDrone;
  id: string;
};

export type SwapApplyPair = {
  drone1: SwapResolvedDrone;
  drone2: SwapResolvedDrone;
};

export const getSwapAdjustMissionMappingArgs = (
  pair: SwapApplyPair,
  reverseMapping: Readonly<Record<string, MissionIndex>>
): { to: MissionIndex; uavId: Identifier } | null => {
  const missionIndex1 = reverseMapping[pair.drone1.uavId] ?? null;
  const missionIndex2 = reverseMapping[pair.drone2.uavId] ?? null;

  if (missionIndex1 === null && missionIndex2 === null) {
    return null;
  }

  if (missionIndex1 !== null && missionIndex2 === null) {
    return { uavId: pair.drone2.uavId, to: missionIndex1 };
  }

  if (missionIndex2 !== null && missionIndex1 === null) {
    return { uavId: pair.drone1.uavId, to: missionIndex2 };
  }

  return { uavId: pair.drone1.uavId, to: missionIndex2 };
};

/**
 * UAV IDs whose show upload is outdated after applying one pair — same set as
 * `adjustMissionMapping` notifies via `notifyUAVsInMissionMappingChanged`.
 */
export const getSwapPairAffectedUavIds = (
  pair: SwapApplyPair,
  mapping: ReadonlyArray<Nullable<Identifier>>,
  reverseMapping: Readonly<Record<string, MissionIndex>>
): Identifier[] => {
  const args = getSwapAdjustMissionMappingArgs(pair, reverseMapping);
  if (!args) {
    return [];
  }

  const { uavId, to } = args;
  const affectedUavIds: Identifier[] = [uavId];
  const uavIdToReplace = mapping[to];

  if (!isNil(uavIdToReplace)) {
    affectedUavIds.push(uavIdToReplace);
  }

  return affectedUavIds;
};

export const buildSwapApplyPairs = (
  queue: readonly SwapQueuedPair[],
  applyCurrentPair: boolean,
  currentDrone1: SwapResolvedDrone | null,
  currentDrone2: SwapResolvedDrone | null
): SwapApplyPair[] => {
  const pairs: SwapApplyPair[] = queue.map(({ drone1, drone2 }) => ({
    drone1,
    drone2,
  }));

  if (applyCurrentPair && currentDrone1 && currentDrone2) {
    pairs.push({ drone1: currentDrone1, drone2: currentDrone2 });
  }

  return pairs;
};

export const currentPairOverlapsQueue = (
  drone1: SwapResolvedDrone | null,
  drone2: SwapResolvedDrone | null,
  queue: readonly SwapQueuedPair[]
): boolean => {
  if (!drone1 || !drone2 || queue.length === 0) {
    return false;
  }

  const queuedIds = new Set(
    queue.flatMap(({ drone1: first, drone2: second }) => [
      first.uavId,
      second.uavId,
    ])
  );

  return queuedIds.has(drone1.uavId) || queuedIds.has(drone2.uavId);
};

export const emptySwapSlot = () => ({
  filterText: '',
  resolved: null,
});

export const swapDroneRef = (drone: SwapResolvedDrone): string =>
  drone.missionIndex === null
    ? drone.uavId
    : `${drone.uavId}/${formatMissionId(drone.missionIndex)}`;

export const getSwapApplyPairKey = (pair: SwapApplyPair): string =>
  `${swapDroneRef(pair.drone1)}->${swapDroneRef(pair.drone2)}`;

export const getSwapPreviewLineKey = (line: SwapPreviewLine): string =>
  `${line.i18nKey}:${Object.values(line.badges)
    .map((badge) => badge.label)
    .join('|')}`;

/** Drone label after swap: same UAV ID, show ID taken from the paired drone. */
export const swapDronePostSwapRef = (
  drone: SwapResolvedDrone,
  pairedDrone: SwapResolvedDrone
): string =>
  pairedDrone.missionIndex === null
    ? drone.uavId
    : `${drone.uavId}/${formatMissionId(pairedDrone.missionIndex)}`;

const fieldBadgeColor = (
  drone: SwapResolvedDrone,
  leftDrone: SwapResolvedDrone
): SwapPreviewBadgeColor =>
  drone.uavId === leftDrone.uavId ? 'left' : 'right';

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

export type SwapBatchValidationReason = 'blocked' | 'empty' | 'stale';

export type SwapBatchValidation =
  | { applyCurrentPair: boolean; valid: true }
  | { message: string; reason: SwapBatchValidationReason; valid: false };

export const resolveCurrentDroneState = (
  drone: SwapResolvedDrone,
  onlineUavIds: readonly Identifier[],
  reverseMapping: Readonly<Record<string, MissionIndex>>
): SwapResolvedDrone | null => {
  if (!onlineUavIds.includes(drone.uavId)) {
    return null;
  }

  return {
    uavId: drone.uavId,
    missionIndex: reverseMapping[drone.uavId] ?? null,
  };
};

export const isStoredSwapPairStale = (
  pair: SwapQueuedPair,
  onlineUavIds: readonly Identifier[],
  reverseMapping: Readonly<Record<string, MissionIndex>>
): boolean => {
  const currentDrone1 = resolveCurrentDroneState(
    pair.drone1,
    onlineUavIds,
    reverseMapping
  );
  const currentDrone2 = resolveCurrentDroneState(
    pair.drone2,
    onlineUavIds,
    reverseMapping
  );

  if (!currentDrone1 || !currentDrone2) {
    return true;
  }

  return (
    currentDrone1.missionIndex !== pair.drone1.missionIndex ||
    currentDrone2.missionIndex !== pair.drone2.missionIndex
  );
};

export const validateSwapBatch = (
  queue: readonly SwapQueuedPair[],
  currentDrone1: SwapResolvedDrone | null,
  currentDrone2: SwapResolvedDrone | null,
  blocked: boolean,
  onlineUavIds: readonly Identifier[],
  reverseMapping: Readonly<Record<string, MissionIndex>>,
  t: TFunction
): SwapBatchValidation => {
  if (blocked) {
    return {
      valid: false,
      reason: 'blocked',
      message: t('swapDronesDialog.preview.blocked'),
    };
  }

  const currentPreview = buildSwapPreview(
    currentDrone1,
    currentDrone2,
    false,
    t
  );
  const applyCurrentPair =
    currentPreview.kind === 'ready' &&
    !currentPairOverlapsQueue(currentDrone1, currentDrone2, queue);

  if (queue.length === 0 && !applyCurrentPair) {
    return { valid: false, reason: 'empty', message: '' };
  }

  for (const pair of queue) {
    if (isStoredSwapPairStale(pair, onlineUavIds, reverseMapping)) {
      return {
        valid: false,
        reason: 'stale',
        message: t('swapDronesDialog.queue.stalePairs'),
      };
    }
  }

  return { valid: true, applyCurrentPair };
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
            drone: { label: swapDroneRef(drone1), color: 'left' },
            slot: { label: formatMissionId(drone2.missionIndex!) },
          },
        },
        {
          i18nKey: 'swapDronesDialog.preview.movedToShowId',
          badges: {
            drone: { label: swapDroneRef(drone2), color: 'right' },
            slot: { label: formatMissionId(drone1.missionIndex!) },
          },
        },
        {
          i18nKey: 'swapDronesDialog.preview.uploadToDrones',
          badges: {
            drone1: {
              label: swapDronePostSwapRef(drone1, drone2),
              color: 'left',
            },
            drone2: {
              label: swapDronePostSwapRef(drone2, drone1),
              color: 'right',
            },
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
          drone: {
            label: swapDroneRef(mapped),
            color: fieldBadgeColor(mapped, drone1),
          },
        },
      },
      {
        i18nKey: 'swapDronesDialog.preview.addedWithShowId',
        badges: {
          drone: {
            label: swapDroneRef(spare),
            color: fieldBadgeColor(spare, drone1),
          },
          slot: { label: formatMissionId(mapped.missionIndex!) },
        },
      },
      {
        i18nKey: 'swapDronesDialog.preview.uploadToDrone',
        badges: {
          drone: {
            label: swapDronePostSwapRef(spare, mapped),
            color: fieldBadgeColor(spare, drone1),
          },
        },
      },
    ],
  };
};

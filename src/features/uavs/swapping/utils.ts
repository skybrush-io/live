import isNil from 'lodash-es/isNil';

import { moveUAVInMapping } from '~/features/mission/utils';
import type { MissionIndex } from '~/model/missions';
import type { Identifier } from '~/utils/collections';
import { formatMissionId, parseMissionId } from '~/utils/formatting';
import type { Nullable } from '~/utils/types';

import type {
  DroneRef,
  DroneRefPair,
  PartiallyResolvedDronePair,
  ResolvedDrone,
  SwapFieldSide,
} from './types';

type SwapPreviewBadgeColor = SwapFieldSide;

/**
 * Badge in a preview line; colored according to the field of the drone it
 * refers to, uncolored if it refers to a slot.
 */
type SwapPreviewBadge = {
  color?: SwapPreviewBadgeColor;
  label: string;
};

/**
 * Single line of the swap preview: an i18n key whose `<name/>` placeholders are
 * replaced by the badges with the same name.
 */
export type SwapPreviewLine = {
  badges: Record<string, SwapPreviewBadge>;
  i18nKey: string;
};

/**
 * State of the swap preview: `blocked` if swapping is not allowed at all,
 * `placeholder` if the fields do not resolve to two drones yet, `warning` if
 * the resolved pair cannot be swapped and `ready` if it can.
 */
export type SwapPreviewState =
  | { kind: 'blocked'; messageKey: string }
  | { kind: 'placeholder'; messageKey: string }
  | { kind: 'ready'; lines: SwapPreviewLine[] }
  | { kind: 'warning'; messageKey: string };

const getMissionIndexOf = (
  mapping: ReadonlyArray<Nullable<Identifier>>,
  uavId: Identifier
): MissionIndex | null => {
  const index = mapping.indexOf(uavId);
  return index >= 0 ? index : null;
};

/**
 * Returns the i18n key of the reason why the given pair of drones cannot be
 * swapped, or `null` if the swap is feasible.
 */
export const getSwapPairProblem = (
  drone1: ResolvedDrone,
  drone2: ResolvedDrone
): string | null => {
  if (drone1.uavId === drone2.uavId) {
    return 'swapDronesDialog.preview.sameDrone';
  }

  if (drone1.missionIndex === null && drone2.missionIndex === null) {
    return 'swapDronesDialog.preview.bothUnmapped';
  }

  return null;
};

/**
 * Return type of `simulateSwapBatch` that simulates the execution of a given sequence
 * of swaps.
 */
export type SwapBatchResult = (
  | { ok: true; mapping: Array<Nullable<Identifier>> }
  | { ok: false; failedIndex: number }
) & {
  /**
   * The drones of each evaluated swap, resolved in the mapping that results from
   * the swaps preceding it; swaps after a failed one are not evaluated
   */
  resolvedPairs: PartiallyResolvedDronePair[];
};

/**
 * Simulates the execution of the given swaps, in order, on the given mapping.
 * The drone references of each swap are resolved and checked against the mapping
 * that results from the swaps preceding it. Returns the final mapping, or the
 * index of the first swap that cannot be executed.
 */
export const simulateSwapBatch = (
  mapping: ReadonlyArray<Nullable<Identifier>>,
  uavIds: readonly Identifier[],
  pairs: readonly DroneRefPair[]
): SwapBatchResult => {
  let current = [...mapping];
  const resolvedPairs: PartiallyResolvedDronePair[] = [];

  for (const [index, pair] of pairs.entries()) {
    const drone1 = resolveDroneRef(pair.drone1, uavIds, current);
    const drone2 = resolveDroneRef(pair.drone2, uavIds, current);
    resolvedPairs.push({ drone1, drone2 });

    if (!drone1 || !drone2 || getSwapPairProblem(drone1, drone2) !== null) {
      return { ok: false, failedIndex: index, resolvedPairs };
    }

    // Move the unmapped drone (if any) to the slot of the other one; the other
    // one takes its original place or leaves the mapping
    current =
      drone2.missionIndex === null
        ? moveUAVInMapping(current, drone2.uavId, drone1.missionIndex)
        : moveUAVInMapping(current, drone1.uavId, drone2.missionIndex);
  }

  return { ok: true, mapping: current, resolvedPairs };
};

/**
 * Formats an unresolved drone reference (UAV ID or slot ID) the way the user would type it.
 */
export const formatDroneRef = (ref: DroneRef): string =>
  ref.kind === 'uav' ? ref.uavId : formatMissionId(ref.missionIndex);

/**
 * Formats a resolved drone reference the way the user would type it.
 */
export const formatResolvedDroneRef = (drone: ResolvedDrone): string =>
  drone.missionIndex === null
    ? drone.uavId
    : `${drone.uavId}/${formatMissionId(drone.missionIndex)}`;

/**
 * Formats a drone pill label after swap: same UAV ID, slot ID taken from the paired
 * drone.
 */
export const formatResolvedDroneRefPostSwap = (
  drone: ResolvedDrone,
  pairedDrone: ResolvedDrone
): string =>
  pairedDrone.missionIndex === null
    ? drone.uavId
    : `${drone.uavId}/${formatMissionId(pairedDrone.missionIndex)}`;

/**
 * Returns a React key for a preview line; unique among the lines of a preview.
 */
export const getSwapPreviewLineKey = (line: SwapPreviewLine): string =>
  `${line.i18nKey}:${Object.values(line.badges)
    .map((badge) => badge.label)
    .join('|')}`;

/**
 * Returns the badge color of a drone of the pair: the color of the field it was
 * entered in.
 */
const fieldBadgeColor = (
  drone: ResolvedDrone,
  leftDrone: ResolvedDrone
): SwapPreviewBadgeColor =>
  drone.uavId === leftDrone.uavId ? 'left' : 'right';

/**
 * Parses a typed/selected value into a drone reference: a show ID (`sN`) refers
 * to a slot, anything else to a known UAV, matched case-insensitively.
 */
export const parseDroneRef = (
  query: string,
  uavIds: readonly Identifier[]
): DroneRef | null => {
  const trimmed = query.trim();
  if (!trimmed) {
    return null;
  }

  const missionIndex = parseMissionId(trimmed);
  if (missionIndex !== undefined) {
    return { kind: 'slot', missionIndex };
  }

  const matchedUavId = uavIds.find(
    (id) => id.toLowerCase() === trimmed.toLowerCase()
  );
  return matchedUavId ? { kind: 'uav', uavId: matchedUavId } : null;
};

/**
 * Resolves a drone reference to a known UAV in the given mapping. A slot
 * reference must hit a filled slot of the mapping.
 *
 * @param ref - the reference to resolve
 * @param uavIds - array of all the UAV IDs that are accepted
 * @param mapping - mapping from mapping slot indices to the IDs od the UAVs that
 *        occupy the slots
 */
export const resolveDroneRef = (
  ref: DroneRef,
  uavIds: readonly Identifier[],
  mapping: ReadonlyArray<Nullable<Identifier>>
): ResolvedDrone | null => {
  if (ref.kind === 'uav') {
    return uavIds.includes(ref.uavId)
      ? {
          uavId: ref.uavId,
          missionIndex: getMissionIndexOf(mapping, ref.uavId),
        }
      : null;
  }

  const uavId = mapping[ref.missionIndex];
  return isNil(uavId) || !uavIds.includes(uavId)
    ? null
    : { uavId, missionIndex: ref.missionIndex };
};

/**
 * Builds the preview of swapping the given drones. Both mapped: the drones
 * exchange their show IDs. One mapped: the unmapped (spare) drone takes the show
 * ID of the mapped one, which leaves the mapping.
 */
export const buildSwapPreview = (
  drone1: ResolvedDrone | null,
  drone2: ResolvedDrone | null,
  blocked: boolean
): SwapPreviewState => {
  if (blocked) {
    return {
      kind: 'blocked',
      messageKey: 'swapDronesDialog.preview.blocked',
    };
  }

  if (!drone1 || !drone2) {
    return {
      kind: 'placeholder',
      messageKey: 'swapDronesDialog.preview.selectTwoDrones',
    };
  }

  const problem = getSwapPairProblem(drone1, drone2);
  if (problem !== null) {
    return { kind: 'warning', messageKey: problem };
  }

  const mapped1 = drone1.missionIndex !== null;
  const mapped2 = drone2.missionIndex !== null;

  if (mapped1 && mapped2) {
    return {
      kind: 'ready',
      lines: [
        {
          i18nKey: 'swapDronesDialog.preview.movedToShowId',
          badges: {
            drone: { label: formatResolvedDroneRef(drone1), color: 'left' },
            slot: { label: formatMissionId(drone2.missionIndex) },
          },
        },
        {
          i18nKey: 'swapDronesDialog.preview.movedToShowId',
          badges: {
            drone: { label: formatResolvedDroneRef(drone2), color: 'right' },
            slot: { label: formatMissionId(drone1.missionIndex) },
          },
        },
        {
          i18nKey: 'swapDronesDialog.preview.uploadToDrones',
          badges: {
            drone1: {
              label: formatResolvedDroneRefPostSwap(drone1, drone2),
              color: 'left',
            },
            drone2: {
              label: formatResolvedDroneRefPostSwap(drone2, drone1),
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
            label: formatResolvedDroneRef(mapped),
            color: fieldBadgeColor(mapped, drone1),
          },
        },
      },
      {
        i18nKey: 'swapDronesDialog.preview.addedWithShowId',
        badges: {
          drone: {
            label: formatResolvedDroneRef(spare),
            color: fieldBadgeColor(spare, drone1),
          },
          slot: {
            label: formatMissionId(
              // non-null: at least one drone is mapped when we reach this point
              mapped.missionIndex!
            ),
          },
        },
      },
      {
        i18nKey: 'swapDronesDialog.preview.uploadToDrone',
        badges: {
          drone: {
            label: formatResolvedDroneRefPostSwap(spare, mapped),
            color: fieldBadgeColor(spare, drone1),
          },
        },
      },
    ],
  };
};

import type { MissionIndex } from '~/model/missions';
import type { Identifier } from '~/utils/collections';
import { formatMissionId, parseMissionId } from '~/utils/formatting';
import type { Nullable } from '~/utils/types';

import type {
  DroneRef,
  DroneRefPair,
  PartiallyResolvedDronePair,
  SwapEndpoint,
  SwapFieldSide,
} from './types';

type SwapPreviewBadgeColor = SwapFieldSide;

/**
 * Badge in a preview line; colored according to the field of the drone it
 * refers to, uncolored if it refers to a slot. Drones that are not online are
 * marked as such.
 */
type SwapPreviewBadge = {
  color?: SwapPreviewBadgeColor;
  label: string;
  offline?: boolean;
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
 * `placeholder` if the fields do not resolve to two endpoints yet, `warning` if
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
 * Returns the i18n key of the reason why the given pair of endpoints cannot be
 * swapped, or `null` if the swap is feasible.
 */
export const getSwapPairProblem = (
  drone1: SwapEndpoint,
  drone2: SwapEndpoint
): string | null => {
  if (drone1.uavId !== null && drone1.uavId === drone2.uavId) {
    return 'swapDronesDialog.preview.sameDrone';
  }

  if (
    drone1.missionIndex !== null &&
    drone1.missionIndex === drone2.missionIndex
  ) {
    return 'swapDronesDialog.preview.sameSlot';
  }

  if (drone1.missionIndex === null && drone2.missionIndex === null) {
    return 'swapDronesDialog.preview.bothUnmapped';
  }

  if (drone1.uavId === null && drone2.uavId === null) {
    return 'swapDronesDialog.preview.bothEmpty';
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
   * The endpoints of each evaluated swap, resolved in the mapping that results
   * from the swaps preceding it; swaps after a failed one are not evaluated
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
  pairs: readonly DroneRefPair[]
): SwapBatchResult => {
  const current = [...mapping];
  const resolvedPairs: PartiallyResolvedDronePair[] = [];

  for (const [index, pair] of pairs.entries()) {
    const drone1 = resolveDroneRef(pair.drone1, current);
    const drone2 = resolveDroneRef(pair.drone2, current);
    resolvedPairs.push({ drone1, drone2 });

    if (!drone1 || !drone2 || getSwapPairProblem(drone1, drone2) !== null) {
      return { ok: false, failedIndex: index, resolvedPairs };
    }

    // Each slot of the pair receives the content of the other endpoint: a
    // drone or emptiness. A drone not in the mapping leaves no slot behind,
    // while the drone in the slot it receives leaves the mapping
    if (drone1.missionIndex !== null) {
      current[drone1.missionIndex] = drone2.uavId;
    }

    if (drone2.missionIndex !== null) {
      current[drone2.missionIndex] = drone1.uavId;
    }
  }

  return { ok: true, mapping: current, resolvedPairs };
};

/**
 * Formats an unresolved drone reference (UAV ID or slot ID) the way the user would type it.
 */
export const formatDroneRef = (ref: DroneRef): string =>
  ref.kind === 'uav' ? ref.uavId : formatMissionId(ref.missionIndex);

/**
 * Formats a resolved endpoint the way the user would type it.
 */
export const formatSwapEndpoint = (drone: SwapEndpoint): string =>
  drone.uavId === null
    ? formatMissionId(drone.missionIndex)
    : drone.missionIndex === null
      ? drone.uavId
      : `${drone.uavId}/${formatMissionId(drone.missionIndex)}`;

/**
 * Returns a React key for a preview line; unique among the lines of a preview.
 */
export const getSwapPreviewLineKey = (line: SwapPreviewLine): string =>
  `${line.i18nKey}:${Object.values(line.badges)
    .map((badge) => badge.label)
    .join('|')}`;

/**
 * Returns whether the given text is a show ID (`sN`) or the beginning of one.
 */
export const looksLikeShowId = (text: string): boolean =>
  /^s\d*$/i.test(text.trim());

/**
 * Parses a typed/selected value into a drone reference: a show ID (`sN`) refers
 * to a slot, anything else to a drone. Drones need not be known; the ID of a
 * known drone is matched case-insensitively and stored in its canonical form,
 * other IDs are kept as typed. Incomplete or invalid show IDs (`s`, `s0`)
 * parse into nothing.
 */
export const parseDroneRef = (
  query: string,
  knownUavIds: readonly Identifier[]
): DroneRef | null => {
  const trimmed = query.trim();
  if (!trimmed) {
    return null;
  }

  const missionIndex = parseMissionId(trimmed);
  if (missionIndex !== undefined) {
    return { kind: 'slot', missionIndex };
  }

  if (looksLikeShowId(trimmed)) {
    return null;
  }

  const matchedUavId = knownUavIds.find(
    (id) => id.toLowerCase() === trimmed.toLowerCase()
  );
  return { kind: 'uav', uavId: matchedUavId ?? trimmed };
};

/**
 * Resolves a drone reference in the given mapping. A drone reference always
 * resolves; a slot reference resolves to the drone in the slot or to an empty
 * slot, but fails if the slot is not part of the mapping.
 *
 * @param ref - the reference to resolve
 * @param mapping - mapping from mapping slot indices to the IDs of the UAVs that
 *        occupy the slots
 */
export const resolveDroneRef = (
  ref: DroneRef,
  mapping: ReadonlyArray<Nullable<Identifier>>
): SwapEndpoint | null => {
  if (ref.kind === 'uav') {
    return {
      uavId: ref.uavId,
      missionIndex: getMissionIndexOf(mapping, ref.uavId),
    };
  }

  return ref.missionIndex < mapping.length
    ? {
        uavId: mapping[ref.missionIndex] ?? null,
        missionIndex: ref.missionIndex,
      }
    : null;
};

/**
 * Builds the preview of swapping the given endpoints: each slot of the pair
 * receives the content of the other endpoint. Lines describing where drones go
 * come first, then the ones describing what is left behind, then the drones
 * that need an upload and the ones that are not online.
 */
export const buildSwapPreview = (
  drone1: SwapEndpoint | null,
  drone2: SwapEndpoint | null,
  onlineUavIds: readonly Identifier[],
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

  const sides = [
    { side: 'left', drone: drone1, other: drone2 },
    { side: 'right', drone: drone2, other: drone1 },
  ] as const;

  const droneBadge = (
    drone: SwapEndpoint,
    side: SwapFieldSide,
    label = formatSwapEndpoint(drone)
  ): SwapPreviewBadge => ({
    label,
    color: side,
    offline: drone.uavId !== null && !onlineUavIds.includes(drone.uavId),
  });

  const arrivals: SwapPreviewLine[] = [];
  const departures: SwapPreviewLine[] = [];
  const uploads: SwapPreviewBadge[] = [];
  const offline: SwapPreviewBadge[] = [];

  for (const { side, drone, other } of sides) {
    if (drone.uavId === null) {
      // Empty slot; the drone of the other endpoint moves here and its own
      // slot (if any) becomes empty. Described from the side of that drone.
      continue;
    }

    if (other.missionIndex === null) {
      departures.push({
        i18nKey: 'swapDronesDialog.preview.removedFromMapping',
        badges: { drone: droneBadge(drone, side) },
      });
    } else {
      arrivals.push({
        i18nKey:
          drone.missionIndex === null
            ? 'swapDronesDialog.preview.addedWithShowId'
            : 'swapDronesDialog.preview.movedToShowId',
        badges: {
          drone: droneBadge(drone, side),
          slot: { label: formatMissionId(other.missionIndex) },
        },
      });
      uploads.push(
        droneBadge(
          drone,
          side,
          `${drone.uavId}/${formatMissionId(other.missionIndex)}`
        )
      );

      if (other.uavId === null && drone.missionIndex !== null) {
        departures.push({
          i18nKey: 'swapDronesDialog.preview.slotEmptied',
          badges: { slot: { label: formatMissionId(drone.missionIndex) } },
        });
      }
    }

    const badge = droneBadge(drone, side);
    if (badge.offline) {
      offline.push(badge);
    }
  }

  return {
    kind: 'ready',
    lines: [
      ...arrivals,
      ...departures,
      ...badgesLine(
        uploads,
        'swapDronesDialog.preview.uploadToDrone',
        'swapDronesDialog.preview.uploadToDrones'
      ),
      ...badgesLine(
        offline,
        'swapDronesDialog.preview.notOnline',
        'swapDronesDialog.preview.notOnlineMultiple'
      ),
    ],
  };
};

/**
 * Returns a preview line listing the given (at most two) drone badges, using
 * the singular or plural i18n key; no line if there are no badges.
 */
const badgesLine = (
  [first, second]: SwapPreviewBadge[],
  singularKey: string,
  pluralKey: string
): SwapPreviewLine[] =>
  first === undefined
    ? []
    : second === undefined
      ? [{ i18nKey: singularKey, badges: { drone: first } }]
      : [{ i18nKey: pluralKey, badges: { drone1: first, drone2: second } }];

import type { MissionIndex } from '~/model/missions';
import type { Identifier } from '~/utils/collections';

/**
 * One side of a swapping operation: a drone with its mission index (`null` if
 * it is not part of the current mission), or an empty mission slot. The drone
 * does not have to be online.
 */
export type SwapEndpoint = Readonly<
  | { uavId: Identifier; missionIndex: MissionIndex | null }
  | { uavId: null; missionIndex: MissionIndex }
>;

/**
 * A pair of endpoints in a swapping operation, each of which is resolved if possible.
 */
export type PartiallyResolvedDronePair = Readonly<{
  drone1: SwapEndpoint | null;
  drone2: SwapEndpoint | null;
}>;

/**
 * Reference to a drone in a swapping operation, either by its ID or by the
 * mission index (slot) that it occupies. Slot references are resolved against
 * the mapping at the time of the swap and may refer to empty slots.
 */
export type DroneRef =
  | Readonly<{ kind: 'uav'; uavId: Identifier }>
  | Readonly<{ kind: 'slot'; missionIndex: MissionIndex }>;

/**
 * A pair of drone references, to be used in a swapping operation.
 */
export type DroneRefPair = Readonly<{
  drone1: DroneRef;
  drone2: DroneRef;
}>;

/**
 * A pair of drone references, to be used in a swapping operation, along with an
 * ID that can be used to unambiguously refer to the pair.
 */
export type DroneRefPairWithId = DroneRefPair & {
  id: string;
};

/** Side where a swap field appears in the dialog */
export type SwapFieldSide = 'left' | 'right';

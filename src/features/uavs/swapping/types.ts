import type { MissionIndex } from '~/model/missions';
import type { Identifier } from '~/utils/collections';

/**
 * Type representing a drone for which we know its ID and its mission index.
 */
export type ResolvedDrone = Readonly<{
  /** The ID of the drone. */
  uavId: Identifier;

  /** The mission index of the drone; `null` if it is not part of the current mission. */
  missionIndex: MissionIndex | null;
}>;

/**
 * A pair of drones in a swapping operation, each of which is resolved if possible.
 */
export type PartiallyResolvedDronePair = Readonly<{
  drone1: ResolvedDrone | null;
  drone2: ResolvedDrone | null;
}>;

/**
 * Reference to a drone in a swapping operation, either by its ID or by the
 * mission index (slot) that it occupies. Slot references are resolved against
 * the mapping at the time of the swap.
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

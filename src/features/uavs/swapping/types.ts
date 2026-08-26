import type { MissionIndex } from '~/model/missions';
import type { Identifier } from '~/utils/collections';

/**
 * Type representing a drone for which we know its ID and its mission index.
 */
export type ResolvedDrone = {
  /** The ID of the drone. */
  uavId: Identifier;

  /** The mission index of the drone; `null` if it is not part of the current mission. */
  missionIndex: MissionIndex | null;
};

/**
 * A pair of resolved drones, to be used in a swapping operation.
 */
export type ResolvedDronePair = {
  drone1: ResolvedDrone;
  drone2: ResolvedDrone;
};

/**
 * A pair of resolved drones, to be used in a swapping operation, along with an ID
 * that can be used to unambiguously refer to the pair.
 */
export type ResolvedDronePairWithId = ResolvedDronePair & {
  id: string;
};

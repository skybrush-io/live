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

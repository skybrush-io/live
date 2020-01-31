/**
 * Returns the current mapping from mission-specific slots to the corresponding
 * UAV identifiers.
 *
 * @param  {Object}  state  the state of the application
 */
export const getMissionMapping = state => state.mission.mapping;

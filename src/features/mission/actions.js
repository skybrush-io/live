/**
 * Thunk that fills the empty slots in the current mapping from the spare drones
 * that are not assigned to a mapping slot yet.
 */
export const augmentMappingAutomaticallyFromSpareDrones = () => (
  dispatch,
  getState
) => {
  console.log('Automap!');
};

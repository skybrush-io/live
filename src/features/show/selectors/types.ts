export type ShowValidationResult =
  | 'loadingFailed'
  | 'notLoaded'
  | 'loading'
  | 'takeoffPositionsTooClose'
  | 'landingPositionsTooClose'
  | 'ok';

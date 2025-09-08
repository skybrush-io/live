export type BoxDragMode = 'add' | 'remove' | 'set';

export type FeatureSelectionMode =
  | 'add'
  | 'remove'
  | 'clear'
  | 'toggle'
  | 'set';

export type FeatureSelectionOrActivationMode =
  | FeatureSelectionMode
  | 'activate';

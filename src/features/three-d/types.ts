import { type EulerOrder, type Vector3Tuple } from 'three';

export type EulerTuple = [...Vector3Tuple, EulerOrder];

export type Scenery = 'indoor' | 'outdoor';

export enum NavigationMode {
  FLY = 'fly',
  WALK = 'walk',
}

export type NavigationSettings = {
  mode: NavigationMode;
};

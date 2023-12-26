import { type EulerOrder, type Vector3Tuple } from 'three';

export type EulerTuple = [...Vector3Tuple, EulerOrder];

export enum NavigationMode {
  FLY = 'fly',
  WALK = 'walk',
}

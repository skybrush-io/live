import type { Coordinate3D } from '~/utils/math';

export type Response_XSHOWADAPT = {
  type: 'X-SHOW-ADAPT';
  show: string;
  takeoffLengthChange: number;
  rthLengthChange: number;
  reason?: string;
  [k: string]: unknown;
};

export type TakeoffMethodType = 'layered' | 'organic';
export type ReturnToHomeMethodType = 'plain' | 'smart';

type DefaultConfiguration = {
  type: 'default';
  /**
   * Brightness in the [0,1] interval.
   */
  brightness: number;
};

/**
 * "Off" configuration, no lights.
 */
type OffConfiguration = {
  type: 'off';
};

/**
 * "Original" configuration that attempts to keep the existing light
 * configuration.
 */
type OriginalConfiguration = {
  type: 'original';
};

/**
 * Solid colored lights configuration.
 */
type SolidConfiguration = {
  type: 'solid';
  /**
   * RGB color code.
   */
  color: string;
};

/**
 * Sparks with an off duration between them.
 */
type SparksConfiguration = {
  type: 'sparks';
  /**
   * RGB color code.
   */
  color: string;
  off_duration: number;
};

/**
 * Light effect types.
 */
export type LightEffectType =
  | DefaultConfiguration['type']
  | OffConfiguration['type']
  | OriginalConfiguration['type']
  | SolidConfiguration['type']
  | SparksConfiguration['type'];

/**
 * Light effect configurations.
 */
export type LightEffectConfiguration =
  | DefaultConfiguration
  | OffConfiguration
  | OriginalConfiguration
  | SolidConfiguration
  | SparksConfiguration;

export type TakeoffTransformation = {
  type: 'takeoff';
  parameters: {
    positions: Array<Coordinate3D | undefined>;
    duration?: number;
    method: 'positions' | 'organic';
    lights: LightEffectConfiguration;
    min_distance: number;
    velocity_xy: number;
    velocity_z: number;
    altitude: number;
    replace: true;
  };
};

export type ReturnToHomeTransformation = {
  type: 'rth';
  parameters: {
    method: ReturnToHomeMethodType;
    lights: LightEffectConfiguration;
    min_distance: number;
    velocity_xy: number;
    velocity_z: number;
    altitude: number;
    replace: true;
  };
};

export type ShiftTransformation = {
  type: 'shift';
  parameters: {
    z: number;
  };
};

export type ShowAdaptTransformation =
  | TakeoffTransformation
  | ReturnToHomeTransformation
  | ShiftTransformation;

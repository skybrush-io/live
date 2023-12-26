import type { Status } from './semantics';

/**
 * Commonly used semantic color names throughout Skybrush apps.
 */
export declare const Colors: {
  readonly off: '#616161';
  readonly error: '#f00';
  readonly info: '#03a9f4';
  readonly success: '#00c853';
  readonly warning: '#fbc02d';
  readonly missing: '#f0f';
  readonly dropTarget: 'rgba(3, 169, 244, 0.5)';
  readonly axes: {
    readonly x: '#f44';
    readonly y: '#4f4';
    readonly z: '#06f';
  };
  readonly markers: {
    readonly landing: '#3c3';
    readonly origin: '#f44';
    readonly takeoff: '#fc0';
  };
  readonly seriousWarning: 'rgb(253, 96, 23)';
};

/**
 * Returns an appropriate color for the given semantic status code.
 */
export declare const colorForStatus: (status: Status) => string;

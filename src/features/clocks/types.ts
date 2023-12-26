import { type Identifier } from '~/utils/collections';

/**
 * @example
 * {
 *     format: 'yyyy-MM-dd HH:mm:ss xx',     // optional
 *     id: 'system',
 *     epoch: 'unix',                        // optional
 *     referenceTime: 0,                     // optional
 *     running: false,
 *     ticks: 0,
 *     ticksPerSecond: 1,                    // optional, defaults to 1
 * }
 */
export type Clock = {
  epoch: number;
  format?: string;
  id: Identifier;
  referenceTime?: number;
  running: boolean;
  ticks: number;
  ticksPerSecond: number;
};

export enum CommonClockId {
  SYSTEM = 'system',
  LOCAL = '__local__',
  MISSION = 'mission',
  MTC = 'mtc',
  SHOW = 'show',
  END_OF_SHOW = 'end_of_show',
}

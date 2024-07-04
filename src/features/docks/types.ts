import { type GPSPosition } from '~/model/geography';
import { type Identifier } from '~/utils/collections';

export enum DockDetailsDialogTab {
  LIVE_CAM = 'liveCam',
  SCHEDULE = 'schedule',
  STATUS = 'status',
  STORAGE = 'storage',
}

/**
 * @example
 * {
 *   id: 'DOCK:123456'
 * }
 */
export type DockState = {
  id: Identifier;
  position?: GPSPosition;
};

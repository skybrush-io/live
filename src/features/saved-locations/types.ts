import { type LatLonObject } from '~/utils/geography';
import { type Identifier } from '~/utils/collections';

export type SavedLocation = {
  id: Identifier;
  name: string;
  center: LatLonObject;
  rotation: number;
  zoom: number;
  notes: string;
};

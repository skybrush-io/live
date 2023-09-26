import { type Identifier } from '~/utils/collections';

export type SavedLocation = {
  id: Identifier;
  name: string;
  center: {
    lon: number;
    lat: number;
  };
  rotation: number;
  zoom: number;
  notes: string;
};

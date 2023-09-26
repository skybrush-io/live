import { type Identifier } from '~/utils/collections';

export type LCDClock = {
  id: Identifier;
  clockId: string;
  preset: number; // TODO: Maybe limit this to `[0..NUM_PRESETS]`
};

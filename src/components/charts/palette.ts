import { type Color } from '@mui/material/styles';
import createColor from 'color';

import {
  blue,
  green,
  lime,
  orange,
  pink,
  purple,
  red,
  teal,
} from '@mui/material/colors';

export type PaletteEntry = {
  color: string;
  areaColor: string;
};

const createPaletteEntry = (color: Color): PaletteEntry => ({
  color: color[500],
  areaColor: createColor(color[500]).alpha(0.4).rgb().string(),
});

const PALETTE: PaletteEntry[] = (
  [blue, green, red, orange, pink, purple, lime, teal] as Color[]
).map(createPaletteEntry);

export const resolveColorIndex = (colorIndex: number | undefined) =>
  typeof colorIndex === 'number' && colorIndex >= 0
    ? PALETTE[colorIndex % PALETTE.length]
    : undefined;

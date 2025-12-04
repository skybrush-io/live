/**
 * @file Default-style color picker used throughout the application in most
 * places where there is enough space.
 */

import {
  amber,
  blue,
  blueGrey,
  brown,
  cyan,
  deepOrange,
  deepPurple,
  green,
  indigo,
  lightGreen,
  lime,
  orange,
  pink,
  purple,
  red,
  teal,
  yellow,
} from '@mui/material/colors';
import merge from 'lodash-es/merge';
import { SwatchesPicker, type SwatchesPickerProps } from 'react-color';
export type { ColorResult } from 'react-color';

const hues = [
  red,
  pink,
  purple,
  deepPurple,
  indigo,
  blue,
  cyan,
  teal,
  green,
  lightGreen,
  lime,
  yellow,
  amber,
  orange,
  deepOrange,
  brown,
  blueGrey,
] as const;
const shades = ['700', '500', '300'] as const;

const pickerProps = {
  colors: hues
    .map<string[]>((hue) => shades.map((shade) => hue[shade]))
    .concat([['#000000', '#808080', '#FFFFFF']]),
  width: 450,
  height: 170,
};

const pickerStyles = {
  default: {
    overflow: { overflowY: 'hidden' },
    body: { padding: 0 },
  },
};

export type SwatchesColorPickerProps = Omit<SwatchesPickerProps, 'className'>;

const SwatchesColorPicker = ({ styles, ...rest }: SwatchesColorPickerProps) => (
  <SwatchesPicker
    className='borderless'
    styles={merge(pickerStyles, styles)}
    {...pickerProps}
    {...rest}
  />
);

export default SwatchesColorPicker;

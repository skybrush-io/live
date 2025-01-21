/**
 * @file Default-style color picker used throughout the application in most
 * places where there is enough space.
 */

import merge from 'lodash-es/merge';
import React from 'react';
import { SwatchesPicker } from 'react-color';

import {
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
} from '@material-ui/core/colors';

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
  colors: (
    hues.map((hue) => shades.map((shade) => hue[shade])) as string[][]
  ).concat([['#000000', '#808080', '#FFFFFF']]),
  width: 450,
  height: 170,
};

const pickerStyles = {
  default: {
    overflow: { overflowY: 'hidden' },
    body: { padding: 0 },
  },
};

type SwatchesColorPickerProps = Omit<
  React.ComponentProps<typeof SwatchesPicker>,
  'className' | keyof typeof pickerProps
>;

export default ({ styles, ...rest }: SwatchesColorPickerProps) => (
  <SwatchesPicker
    className='borderless'
    styles={merge(pickerStyles, styles)}
    {...pickerProps}
    {...rest}
  />
);

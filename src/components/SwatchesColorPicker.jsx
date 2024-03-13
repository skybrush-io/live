/**
 * @file Default-style color picker used throughout the application in most
 * places where there is enough space.
 */

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
];
const shades = ['700', '500', '300'];

const pickerProps = {
  colors: hues
    .map((hue) => shades.map((shade) => hue[shade]))
    .concat([['#000000', '#808080', '#FFFFFF']]),
  width: 450,
  height: 170,
};

const SwatchesColorPicker = (props) => (
  <SwatchesPicker className='borderless' {...pickerProps} {...props} />
);

export default SwatchesColorPicker;

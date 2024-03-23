/**
 * @file Default-style color picker used throughout the application in most
 * places where there is enough space.
 */

import merge from 'lodash-es/merge';
import PropTypes from 'prop-types';
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

const pickerStyles = {
  default: {
    overflow: { overflowY: 'hidden' },
    body: { padding: 0 },
  },
};

const SwatchesColorPicker = ({ styles, ...rest }) => (
  <SwatchesPicker
    className='borderless'
    styles={merge(pickerStyles, styles)}
    {...pickerProps}
    {...rest}
  />
);

SwatchesColorPicker.propTypes = {
  styles: PropTypes.object,
};

export default SwatchesColorPicker;

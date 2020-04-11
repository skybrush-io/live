/**
 * @file Default-style color picker used throughout the application in most
 * places where there is enough space.
 */

import React from 'react';
import { CirclePicker } from 'react-color';

const circlePickerProps = {
  circleSpacing: 7,
  width: 343
};

export default props => <CirclePicker {...circlePickerProps} {...props} />;

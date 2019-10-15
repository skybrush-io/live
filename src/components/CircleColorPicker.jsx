/**
 * @file Default-style color picker used throughout the application in most
 * places where there is enough space.
 */

import { CirclePicker } from 'react-color';
import withProps from 'recompose/withProps';

export default withProps({
  circleSpacing: 7,
  width: 343
})(CirclePicker);

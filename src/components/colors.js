import createColor from 'color';
import { lightBlue, grey, green, yellow } from '@material-ui/core/colors';

export const Colors = {
  off: grey[700],
  error: '#f00', // possible alternative: red.A400
  info: lightBlue[500],
  success: green.A700,
  warning: yellow[700],

  dropTarget: 'rgba(3, 169, 244, 0.5)', // lightblue.500

  axisColors: {
    x: '#f44',
    y: '#4f4',
    z: '#06f',
  },

  landingMarker: '#3c3',
  originMarker: '#f44',
  takeoffMarker: '#fc0',
};

Colors.seriousWarning = createColor(Colors.warning)
  .mix(createColor(Colors.error))
  .string();

export default Colors;

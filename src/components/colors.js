import createColor from 'color';
import { lightBlue, grey, green, yellow } from '@material-ui/core/colors';
import { Status } from './semantics';

import { Severity } from '~/model/enums';

export const Colors = {
  off: grey[700],
  error: '#f00',
  info: lightBlue[500],
  success: green.A700,
  warning: yellow[700],

  dropTarget: 'rgba(3, 169, 244, 0.5)', // lightblue.500

  axisColors: {
    x: '#f44',
    y: '#4f4',
    z: '#06f',
  },

  geofence: '#f00',
  landingMarker: '#3c3',
  originMarker: '#f44',
  takeoffMarker: '#fc0', // also used in mission-origin-marker.svg
  convexHull: '#fc0',
  plannedTrajectory: '#08f',
};

Colors.seriousWarning = createColor(Colors.warning)
  .mix(createColor(Colors.error))
  .string();

export const statusColorMap = new Map([
  [Status.OFF, Colors.off],
  [Status.ERROR, Colors.error],
  [Status.INFO, Colors.info],
  [Status.SUCCESS, Colors.success],
  [Status.WARNING, Colors.warning],
  [Status.CRITICAL, Colors.seriousWarning],
]);

export const severityColorMap = new Map([
  [Severity.CRITICAL, Colors.seriousWarning],
  [Severity.DEBUG, Colors.off],
  [Severity.ERROR, Colors.error],
  [Severity.INFO, Colors.info],
  [Severity.WARNING, Colors.warning],
]);

const magenta = '#f0f'; // Magenta usually denotes something that is missing.

export const colorForStatus = (status) =>
  statusColorMap.has(status) ? statusColorMap.get(status) : magenta;

export const colorForSeverity = (status) =>
  severityColorMap.has(status) ? severityColorMap.get(status) : magenta;

export default Colors;

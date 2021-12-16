import { yellow } from '@material-ui/core/colors';

import { Colors as ColorsBase } from '@skybrush/app-theme-material-ui';
import { Severity } from '~/model/enums';

export { colorForStatus } from '@skybrush/app-theme-material-ui';

export const Colors = {
  ...ColorsBase,

  geofence: '#f00',
  convexHull: '#fc0',
  plannedTrajectory: '#08f',

  positionHold: yellow.A400,
};

export const severityColorMap = new Map([
  [Severity.CRITICAL, Colors.seriousWarning],
  [Severity.DEBUG, Colors.off],
  [Severity.ERROR, Colors.error],
  [Severity.INFO, Colors.info],
  [Severity.WARNING, Colors.warning],
]);

export const colorForSeverity = (status) =>
  severityColorMap.has(status) ? severityColorMap.get(status) : Colors.missing;

export default Colors;

import * as createColor from 'color';
import mapValues from 'lodash-es/mapValues';

import { yellow } from '@material-ui/core/colors';

import { Colors as ColorsBase } from '@skybrush/app-theme-material-ui';

import { Severity } from '~/model/enums';
import type { NestedRecordField } from '~/utils/types';

export { colorForStatus } from '@skybrush/app-theme-material-ui';

type Color = string;

export const Colors = {
  ...ColorsBase,

  geofence: '#f00',
  convexHull: '#fc0',
  plannedTrajectory: '#08f',

  positionHold: yellow.A400,
} as const;

const convertColorsToRGBTuples = (
  c: NestedRecordField<Color>
): NestedRecordField<readonly number[]> =>
  typeof c === 'object'
    ? mapValues(c, convertColorsToRGBTuples)
    : Object.freeze(createColor(c).rgb().array());

export const RGBColors = convertColorsToRGBTuples(Colors);

export const severityColorMap = new Map<Severity, Color>([
  [Severity.CRITICAL, Colors.seriousWarning],
  [Severity.DEBUG, Colors.off],
  [Severity.ERROR, Colors.error],
  [Severity.INFO, Colors.info],
  [Severity.WARNING, Colors.warning],
]);

export const colorForSeverity = (severity: Severity): Color =>
  severityColorMap.has(severity)
    ? severityColorMap.get(severity)! // NOTE: Bang justified by `has`
    : Colors.missing;

export default Colors;

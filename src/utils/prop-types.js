import PropTypes from 'prop-types';

import { PreflightCheckResult, Severity } from '~/model/enums';

export default {
  angle: PropTypes.number,

  batterySettings: PropTypes.shape({
    defaultCellCount: PropTypes.number,
    voltageThresholds: PropTypes.shape({
      full: PropTypes.number,
      nearFull: PropTypes.number,
      ok: PropTypes.number,
      warning: PropTypes.number,
      critical: PropTypes.number,
    }),
  }),

  coordinate: PropTypes.shape({
    lat: PropTypes.number.isRequired,
    lon: PropTypes.number.isRequired,
  }),

  preflightCheckResult: PropTypes.oneOf(Object.values(PreflightCheckResult)),

  severity: PropTypes.oneOf(Object.values(Severity)),
};

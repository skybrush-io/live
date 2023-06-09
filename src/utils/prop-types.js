import PropTypes from 'prop-types';

import { PreflightCheckResult, Severity } from '~/model/enums';

const CustomPropTypes = {
  angle: PropTypes.number,

  batteryStatus: PropTypes.shape({
    cellCount: PropTypes.number,
    charging: PropTypes.bool,
    voltage: PropTypes.number,
    percentage: PropTypes.number,
  }),

  coordinate: PropTypes.shape({
    lat: PropTypes.number.isRequired,
    lon: PropTypes.number.isRequired,
  }),

  localCoordinate: PropTypes.arrayOf(PropTypes.number),

  preflightCheckResult: PropTypes.oneOf(Object.values(PreflightCheckResult)),

  severity: PropTypes.oneOf(Object.values(Severity)),
};

export default CustomPropTypes;

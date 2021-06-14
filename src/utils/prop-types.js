import PropTypes from 'prop-types';

import { PreflightCheckResult, Severity } from '~/model/enums';

const CustomPropTypes = {
  angle: PropTypes.number,

  coordinate: PropTypes.shape({
    lat: PropTypes.number.isRequired,
    lon: PropTypes.number.isRequired,
  }),

  preflightCheckResult: PropTypes.oneOf(Object.values(PreflightCheckResult)),

  severity: PropTypes.oneOf(Object.values(Severity)),
};

export default CustomPropTypes;

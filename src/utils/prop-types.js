import PropTypes from 'prop-types';

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
};

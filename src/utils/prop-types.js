import PropTypes from 'prop-types';

export default {
  angle: PropTypes.number,
  coordinate: PropTypes.shape({
    lat: PropTypes.number.isRequired,
    lon: PropTypes.number.isRequired,
  }),
};

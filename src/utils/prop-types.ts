import PropTypes from 'prop-types';

const CustomPropTypes = {
  angle: PropTypes.number,

  coordinate: PropTypes.shape({
    lat: PropTypes.number.isRequired,
    lon: PropTypes.number.isRequired,
  }),
};

export default CustomPropTypes;

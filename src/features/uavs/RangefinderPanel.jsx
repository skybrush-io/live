import PropTypes from 'prop-types';
import { useState } from 'react';

import useDeviceTreeSubscription from '~/hooks/useDeviceTreeSubscription';
import RangefinderDisplay from '~/components/uavs/RangefinderDisplay';

const MEASUREMENT_OUT_OF_RANGE = 65534;

const processValue = (value) => {
  if (value === MEASUREMENT_OUT_OF_RANGE) {
    return Number.POSITIVE_INFINITY;
  } else if (typeof value === 'number') {
    return value / 100; // Convert from centimeters to meters
  } else {
    return value;
  }
};

const RangefinderPanel = ({ uavId }) => {
  const [values, setValues] = useState([]);
  useDeviceTreeSubscription(`/${uavId}/rangefinder/measurements`, setValues);
  return <RangefinderDisplay values={values.map(processValue)} />;
};

RangefinderPanel.propTypes = {
  uavId: PropTypes.string,
};

export default RangefinderPanel;

import isNil from 'lodash-es/isNil';
import PropTypes from 'prop-types';
import { useStore } from 'react-redux';
import { useInterval } from 'react-use';

import { getActiveUAVIds, getUAVById } from './selectors';

const AltitudeSummaryUpdater = ({ onSetStatus }) => {
  const store = useStore();

  useInterval(() => {
    if (!onSetStatus) {
      return;
    }

    const state = store.getState();
    let minAltitudeAGL = Number.POSITIVE_INFINITY;
    let maxAltitudeAGL = Number.NEGATIVE_INFINITY;
    let minAltitudeAMSL = Number.POSITIVE_INFINITY;
    let maxAltitudeAMSL = Number.NEGATIVE_INFINITY;
    let minZ = Number.POSITIVE_INFINITY;
    let maxZ = Number.NEGATIVE_INFINITY;

    for (const uavId of getActiveUAVIds(state)) {
      const uav = getUAVById(state, uavId);
      const position = uav?.position;
      if (position) {
        if (!isNil(position.amsl)) {
          minAltitudeAMSL = Math.min(minAltitudeAMSL, position.amsl);
          maxAltitudeAMSL = Math.max(maxAltitudeAMSL, position.amsl);
        }

        if (!isNil(position.agl)) {
          minAltitudeAGL = Math.min(minAltitudeAGL, position.agl);
          maxAltitudeAGL = Math.max(maxAltitudeAGL, position.agl);
        }
      }

      const positionXYZ = uav?.positionXYZ;
      if (positionXYZ && !isNil(positionXYZ[2])) {
        minZ = Math.min(minZ, positionXYZ[2]);
        maxZ = Math.max(maxZ, positionXYZ[2]);
      }
    }

    // If we have at least one AMSL, show AMSL; otherwise fall back to AGL,
    // then to local coordinates (for indoor shows)
    if (Number.isFinite(minAltitudeAMSL)) {
      onSetStatus({ min: minAltitudeAMSL, max: maxAltitudeAMSL });
    } else if (Number.isFinite(minAltitudeAGL)) {
      onSetStatus({ min: minAltitudeAGL, max: maxAltitudeAGL });
    } else if (Number.isFinite(minZ)) {
      onSetStatus({ min: minZ, max: maxZ });
    } else {
      onSetStatus({ min: null, max: null });
    }
  }, 1000);

  return null;
};

AltitudeSummaryUpdater.propTypes = {
  onSetStatus: PropTypes.func,
};

export default AltitudeSummaryUpdater;

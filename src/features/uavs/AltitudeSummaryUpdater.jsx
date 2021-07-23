import isNil from 'lodash-es/isNil';
import PropTypes from 'prop-types';
import { useStore } from 'react-redux';
import { useInterval } from 'react-use';

import { AltitudeSummaryType } from '~/model/settings';

import { getActiveUAVIds, getUAVById } from './selectors';

/**
 * Mapping from altitude summary types to functions that take a UAV object and
 * return an altitude according to the selected summary type (AMSL, AGL or local).
 */
const altitudeGetters = {
  [AltitudeSummaryType.AMSL]: (uav) => uav?.position?.amsl,
  [AltitudeSummaryType.AGL]: (uav) => uav?.position?.agl,
  [AltitudeSummaryType.XYZ]: (uav) => {
    const pos = uav?.localPosition;
    return Array.isArray(pos) ? pos[2] : null;
  },
  dummy: () => null,
};

const AltitudeSummaryUpdater = ({ onSetStatus, type }) => {
  const store = useStore();

  useInterval(() => {
    if (!onSetStatus) {
      return;
    }

    const state = store.getState();
    const getter = altitudeGetters[type] || altitudeGetters.dummy;

    let minAltitude = Number.POSITIVE_INFINITY;
    let maxAltitude = Number.NEGATIVE_INFINITY;

    for (const uavId of getActiveUAVIds(state)) {
      const uav = getUAVById(state, uavId);
      const altitude = getter(uav);

      if (!isNil(altitude)) {
        minAltitude = Math.min(minAltitude, altitude);
        maxAltitude = Math.max(maxAltitude, altitude);
      }
    }

    if (Number.isFinite(minAltitude)) {
      onSetStatus({ min: minAltitude, max: maxAltitude });
    } else {
      onSetStatus({ min: null, max: null });
    }
  }, 1000);

  return null;
};

AltitudeSummaryUpdater.propTypes = {
  onSetStatus: PropTypes.func,
  type: PropTypes.oneOf(Object.values(AltitudeSummaryType)),
};

export default AltitudeSummaryUpdater;

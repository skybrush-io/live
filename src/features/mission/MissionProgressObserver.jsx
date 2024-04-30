import throttle from 'lodash-es/throttle';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import { getUAVIdList } from '~/features/uavs/selectors';
import useDeviceTreeSubscription from '~/hooks/useDeviceTreeSubscription';

import { getReverseMissionMapping } from './selectors';
import { updateProgressDatumForMissionIndex } from './slice';

/**
 * Component that subscribes to waypoint status updates of a single UAV and
 * stores the received information into the state.
 */
const UAVWaypointStatusObserverPresentation = ({ storeProgress, uavId }) => {
  useDeviceTreeSubscription(`/${uavId}/waypoint/status`, storeProgress);
  return null;
};

UAVWaypointStatusObserverPresentation.propTypes = {
  storeProgress: PropTypes.func,
  uavId: PropTypes.string,
};

const UAVWaypointStatusObserver = connect(
  // mapStateToProps
  null,
  // mapDispatchToProps
  (dispatch, ownProps) => ({
    // TODO: Investigate this more thoroughly, throttling here is just a hotfix
    storeProgress: throttle((progress) => {
      if (progress) {
        dispatch(
          updateProgressDatumForMissionIndex(ownProps.missionIndex, {
            currentItemId: progress.id,
            currentItemRatio: progress.ratio,
          })
        );
      }
    }, 1000),
  })
)(UAVWaypointStatusObserverPresentation);

/**
 * Component that conditionally subscribes to updates about the mission progress
 * if the UAV given by the mapping is available.
 */
const MissionProgressObserver = ({
  availableUAVIds,
  reverseMapping,
  storeProgress,
}) =>
  Object.entries(reverseMapping)
    .filter(([uavId, _missionIndex]) => availableUAVIds.includes(uavId))
    .map(([uavId, missionIndex]) => (
      <UAVWaypointStatusObserver
        key={uavId}
        missionIndex={missionIndex}
        uavId={uavId}
        onUpdate={storeProgress}
      />
    ));

MissionProgressObserver.propTypes = {
  availableUAVIds: PropTypes.arrayOf(PropTypes.string),
  firstMissionUAVId: PropTypes.string,
  storeProgress: PropTypes.func,
};

export default connect(
  // mapStateToProps
  (state) => ({
    availableUAVIds: getUAVIdList(state),
    reverseMapping: getReverseMissionMapping(state),
  })
)(MissionProgressObserver);

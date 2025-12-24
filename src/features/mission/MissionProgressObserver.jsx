import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import { getMissionMapping } from '~/features/mission/selectors';
import {
  updateCurrentMissionItemId,
  updateCurrentMissionItemRatio,
} from '~/features/mission/slice';
import useDeviceTreeSubscription from '~/hooks/useDeviceTreeSubscription';
import { getUAVIdList } from '../uavs/selectors';

/**
 * Component that subscribes to waypoint status updates of a single UAV and
 * stores the received information into the state.
 */
const UAVWaypointStatusObserver = ({ uavId, onUpdate }) => {
  useDeviceTreeSubscription(`/${uavId}/waypoint/status`, onUpdate);
  return null;
};

UAVWaypointStatusObserver.propTypes = {
  uavId: PropTypes.string,
  onUpdate: PropTypes.func,
};

/**
 * Component that conditionally subscribes to updates about the mission progress
 * if the UAV given by the mapping is available.
 */
const MissionProgressObserver = ({
  availableUAVIds,
  firstMissionUAVId,
  storeProgress,
}) =>
  availableUAVIds.includes(firstMissionUAVId) ? (
    <UAVWaypointStatusObserver
      uavId={firstMissionUAVId}
      onUpdate={storeProgress}
    />
  ) : null;

MissionProgressObserver.propTypes = {
  availableUAVIds: PropTypes.arrayOf(PropTypes.string),
  firstMissionUAVId: PropTypes.string,
  storeProgress: PropTypes.func,
};

export default connect(
  // mapStateToProps
  (state) => ({
    availableUAVIds: getUAVIdList(state),
    firstMissionUAVId: getMissionMapping(state)[0],
  }),
  // mapDispatchToProps
  {
    storeProgress: (progress) => (dispatch) => {
      if (!progress) {
        return;
      }

      const { id, ratio } = progress;
      dispatch(updateCurrentMissionItemId(id));
      dispatch(updateCurrentMissionItemRatio(ratio));
    },
  }
)(MissionProgressObserver);

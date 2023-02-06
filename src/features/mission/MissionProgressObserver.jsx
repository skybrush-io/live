import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import { getMissionMapping } from '~/features/mission/selectors';
import {
  updateCurrentMissionItemId,
  updateCurrentMissionItemRatio,
} from '~/features/mission/slice';
import useDeviceTreeSubscription from '~/hooks/useDeviceTreeSubscription';

/**
 * Component that subscribes to updates about the mission progress and stores
 * the received information into the state.
 */
const MissionProgressObserver = ({ firstMissionUAVId, storeProgress }) => {
  useDeviceTreeSubscription(
    `/${firstMissionUAVId}/waypoint/status`,
    storeProgress
  );

  return null;
};

MissionProgressObserver.propTypes = {
  firstMissionUAVId: PropTypes.string,
  storeProgress: PropTypes.func,
};

export default connect(
  // mapStateToProps
  (state) => ({
    firstMissionUAVId: getMissionMapping(state)[0],
  }),
  // mapDispatchToProps
  {
    storeProgress:
      ({ id, ratio }) =>
      (dispatch) => {
        dispatch(updateCurrentMissionItemId(id));
        dispatch(updateCurrentMissionItemRatio(ratio));
      },
  }
)(MissionProgressObserver);

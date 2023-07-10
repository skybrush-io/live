import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { createSelector } from '@reduxjs/toolkit';

import { ComplexAvatar } from '~/components/avatar';
import { getReverseMissionMapping } from '~/features/mission/selectors';
import { getBatteryFormatter } from '~/features/settings/selectors';
import { createSingleUAVStatusSummarySelector } from '~/features/uavs/selectors';
import { formatMissionId } from '~/utils/formatting';

/**
 * Connected component that takes a ComplexAvatar and dresses it up to show the
 * status of a single drone.
 */
const DroneAvatar = connect(
  // mapStateToProps
  () => {
    const statusSummarySelector = createSingleUAVStatusSummarySelector();

    return createSelector(
      getBatteryFormatter,
      getReverseMissionMapping,
      (state, { id }) => statusSummarySelector(state, id),
      (_state, ownProps) => ownProps,
      (
        batteryFormatter,
        reverseMissionMapping,
        statusSummary,
        { hint, id, label, variant }
      ) => {
        const props = {
          batteryFormatter,
          ...statusSummary,
        };

        if (!hint && (!label || label === id) && id in reverseMissionMapping) {
          props.hint = formatMissionId(reverseMissionMapping[id]);
        }

        if (variant !== 'full') {
          delete props.batteryStatus;
          delete props.text;
          delete props.details;
        }

        return props;
      }
    );
  }
)(ComplexAvatar);

DroneAvatar.propTypes = {
  id: PropTypes.string,
  variant: PropTypes.oneOf(['full', 'minimal']),
};

DroneAvatar.defaultProps = {
  variant: 'full',
};

export default DroneAvatar;

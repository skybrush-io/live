import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import { ComplexAvatar } from '~/components/avatar';
import { getBatteryIndicatorSettings } from '~/features/settings/selectors';
import { createSingleUAVStatusSummarySelector } from '~/features/uavs/selectors';

/**
 * Connected component that takes a ComplexAvatar and dresses it up to show the
 * status of a single drone.
 */
const DroneAvatar = connect(
  // mapStateToProps
  () => {
    const statusSummarySelector = createSingleUAVStatusSummarySelector();
    return (state, ownProps) => {
      const props = {
        batterySettings: getBatteryIndicatorSettings(state),
        ...statusSummarySelector(state, ownProps.id),
      };

      if (ownProps.variant !== 'full') {
        delete props.batteryStatus;
        delete props.text;
        delete props.details;
      }

      return props;
    };
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

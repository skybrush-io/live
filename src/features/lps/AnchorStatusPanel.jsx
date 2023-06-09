import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import StatusLight from '@skybrush/mui-components/lib/StatusLight';

import { BatteryFormatter } from '~/components/battery';
import { listOf } from '~/components/helpers/lists';
import { Status } from '~/components/semantics';
import { getBatteryFormatter } from '~/features/settings/selectors';
import { formatCoordinateArray } from '~/utils/formatting';
import CustomPropTypes from '~/utils/prop-types';

import { getLocalPositioningSystemById } from './selectors';

/* TODO(ntamas): make the cell count of LPS anchor batteries configurable */
const ANCHOR_BATTERY_CELL_COUNT = 1;

const AnchorStatusListItem = ({ anchor, batteryFormatter, index }) => {
  const hasPosition =
    Array.isArray(anchor?.position) && anchor?.position.length >= 3;
  const status = !anchor?.active
    ? Status.ERROR
    : !hasPosition
    ? Status.WARNING
    : Status.SUCCESS;
  const { battery } = anchor || {};
  const batteryLabel =
    battery && batteryFormatter
      ? batteryFormatter.getBatteryLabel(
          battery.voltage,
          battery.percentage,
          ANCHOR_BATTERY_CELL_COUNT,
          null
        )
      : null;
  let secondaryLabel = hasPosition
    ? formatCoordinateArray(anchor.position)
    : 'Position unknown';

  if (batteryLabel) {
    secondaryLabel = `${secondaryLabel} \u00B7 ${batteryLabel}`;
  }

  return (
    <ListItem>
      <StatusLight status={status} />
      <ListItemText
        primary={`Anchor ${anchor.id || index}`}
        secondary={secondaryLabel}
      />
      {battery &&
        batteryFormatter.getLargeBatteryIcon(
          battery.percentage,
          batteryFormatter.getBatteryStatus(
            battery.voltage,
            battery.percentage,
            ANCHOR_BATTERY_CELL_COUNT
          ),
          anchor.battery.charging
        )}
    </ListItem>
  );
};

AnchorStatusListItem.propTypes = {
  anchor: PropTypes.shape({
    id: PropTypes.string,
    active: PropTypes.bool,
    battery: CustomPropTypes.batteryStatus,
    position: CustomPropTypes.localCoordinate,
  }),
  batteryFormatter: PropTypes.instanceOf(BatteryFormatter),
  index: PropTypes.number,
};

const AnchorStatusPanel = listOf(
  (anchor, { batteryFormatter }, index) => (
    <AnchorStatusListItem
      key={index}
      anchor={anchor}
      batteryFormatter={batteryFormatter}
      index={index}
    />
  ),
  {
    dataProvider: 'items',
    backgroundHint: 'No anchors',
  }
);
AnchorStatusPanel.displayName = 'AnchorStatusPanel';
AnchorStatusPanel.propTypes = {
  batteryFormatter: PropTypes.instanceOf(BatteryFormatter),
  items: PropTypes.arrayOf(PropTypes.shape({})),
};

export default connect(
  // mapStateToProps
  (state, ownProps) => ({
    batteryFormatter: getBatteryFormatter(state),
    items: ownProps.lpsId
      ? getLocalPositioningSystemById(state, ownProps.lpsId)?.anchors
      : null,
    dense: true,
  }),
  // mapDispatchToProps
  {}
)(AnchorStatusPanel);

import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import ListItem from '@material-ui/core/ListItem';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import ListItemText from '@material-ui/core/ListItemText';
import Switch from '@material-ui/core/Switch';

import StepperStatusLight, {
  StepperStatus
} from '~/components/StepperStatusLight';
import { signOffOnManualPreflightChecks } from '~/features/show/actions';
import { areManualPreflightChecksSignedOff } from '~/features/show/selectors';
import {
  clearManualPreflightChecks,
  openManualPreflightChecksDialog
} from '~/features/show/slice';
import { getSetupStageStatuses } from '~/features/show/stages';

/**
 * Component with a button that shows a dialog that allows the user to check how
 * accurately the drones are placed in the takeoff area. The dialog also allows
 * the user to create virtual drones if needed.
 */
const ManualPreflightChecksButton = ({
  areChecksSignedOff,
  onApprove,
  onRevoke,
  status,
  ...rest
}) => {
  return (
    <ListItem button disabled={false && status === StepperStatus.OFF} {...rest}>
      <StepperStatusLight status={status} />
      <ListItemText primary="Manual preflight checks" />
      {/* TODO: show how many checks were not ticked off by the user yet */}
      <ListItemSecondaryAction>
        <Switch
          checked={areChecksSignedOff}
          edge="end"
          onChange={areChecksSignedOff ? onRevoke : onApprove}
        />
      </ListItemSecondaryAction>
    </ListItem>
  );
};

ManualPreflightChecksButton.propTypes = {
  areChecksSignedOff: PropTypes.bool,
  onApprove: PropTypes.func,
  onClick: PropTypes.func,
  onRevoke: PropTypes.func,
  status: PropTypes.oneOf(Object.values(StepperStatus))
};

ManualPreflightChecksButton.defaultProps = {};

export default connect(
  // mapStateToProps
  state => ({
    areChecksSignedOff: areManualPreflightChecksSignedOff(state),
    status: getSetupStageStatuses(state).performManualPreflightChecks
  }),
  // mapDispatchToProps
  {
    onApprove: signOffOnManualPreflightChecks,
    onClick: openManualPreflightChecksDialog,
    onRevoke: clearManualPreflightChecks
  }
)(ManualPreflightChecksButton);

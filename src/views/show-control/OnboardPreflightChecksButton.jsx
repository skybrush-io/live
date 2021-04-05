import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';

import StatusLight from '@skybrush/mui-components/lib/StatusLight';

import { Status } from '~/components/semantics';

import { signOffOnOnboardPreflightChecks } from '~/features/show/actions';
import { areOnboardPreflightChecksSignedOff } from '~/features/show/selectors';
import {
  clearOnboardPreflightChecks,
  openOnboardPreflightChecksDialog,
} from '~/features/show/slice';
import { getSetupStageStatuses } from '~/features/show/stages';

/**
 * Component with a button that shows a dialog that allows the user to check how
 * accurately the drones are placed in the takeoff area. The dialog also allows
 * the user to create virtual drones if needed.
 */
const OnboardPreflightChecksButton = ({
  areChecksSignedOff,
  onApprove,
  onRevoke,
  status,
  ...rest
}) => {
  return (
    <ListItem button disabled={status === Status.OFF} {...rest}>
      <StatusLight status={status} />
      <ListItemText primary='Onboard preflight checks' />
      {/* TODO: show how many drones have nonzero error codes */}
      {/*
      <ListItemSecondaryAction>
        <Switch
          checked={areChecksSignedOff}
          edge='end'
          onChange={areChecksSignedOff ? onRevoke : onApprove}
        />
      </ListItemSecondaryAction>
      */}
    </ListItem>
  );
};

OnboardPreflightChecksButton.propTypes = {
  areChecksSignedOff: PropTypes.bool,
  onApprove: PropTypes.func,
  onRevoke: PropTypes.func,
  status: PropTypes.oneOf(Object.values(Status)),
};

OnboardPreflightChecksButton.defaultProps = {};

export default connect(
  // mapStateToProps
  (state) => ({
    areChecksSignedOff: areOnboardPreflightChecksSignedOff(state),
    status: getSetupStageStatuses(state).waitForOnboardPreflightChecks,
  }),
  // mapDispatchToProps
  {
    onApprove: signOffOnOnboardPreflightChecks,
    onClick: openOnboardPreflightChecksDialog,
    onRevoke: clearOnboardPreflightChecks,
  }
)(OnboardPreflightChecksButton);

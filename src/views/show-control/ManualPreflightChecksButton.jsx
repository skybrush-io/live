import PropTypes from 'prop-types';
import React from 'react';
import { withTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';

import StatusLight from '@skybrush/mui-components/lib/StatusLight';

import { Status } from '~/components/semantics';

import { hasManualPreflightChecks } from '~/features/preflight/selectors';
import { signOffOnManualPreflightChecks } from '~/features/show/actions';
import { areManualPreflightChecksSignedOff } from '~/features/show/selectors';
import {
  clearManualPreflightChecks,
  openManualPreflightChecksDialog,
} from '~/features/show/slice';
import { getSetupStageStatuses } from '~/features/show/stages';

/**
 * Component with a button that shows a dialog that allows the user to verify
 * the fulfillment of the manual preflight criteria.
 */
const ManualPreflightChecksButton = ({
  areChecksSignedOff,
  hasManualChecks,
  onApprove,
  onRevoke,
  status,
  t,
  ...rest
}) => {
  return hasManualChecks ? (
    <ListItem button disabled={status === Status.OFF} {...rest}>
      <StatusLight status={status} />
      <ListItemText
        primary={t('show.manualPreflightChecks', 'Manual preflight checks')}
      />
      {/* TODO: show how many checks were not ticked off by the user yet */}
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
  ) : null;
};

ManualPreflightChecksButton.propTypes = {
  areChecksSignedOff: PropTypes.bool,
  hasManualChecks: PropTypes.bool,
  onApprove: PropTypes.func,
  onClick: PropTypes.func,
  onRevoke: PropTypes.func,
  status: PropTypes.oneOf(Object.values(Status)),
  t: PropTypes.func,
};

ManualPreflightChecksButton.defaultProps = {};

export default connect(
  // mapStateToProps
  (state) => ({
    areChecksSignedOff: areManualPreflightChecksSignedOff(state),
    hasManualChecks: hasManualPreflightChecks(state),
    status: getSetupStageStatuses(state).performManualPreflightChecks,
  }),
  // mapDispatchToProps
  {
    onApprove: signOffOnManualPreflightChecks,
    onClick: openManualPreflightChecksDialog,
    onRevoke: clearManualPreflightChecks,
  }
)(withTranslation()(ManualPreflightChecksButton));

import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import { StatusLight } from '@skybrush/mui-components';

import { Status } from '~/components/semantics';
import { signOffOnOnboardPreflightChecks } from '~/features/show/actions';
import { areOnboardPreflightChecksSignedOff } from '~/features/show/selectors';
import {
  clearOnboardPreflightChecks,
  openOnboardPreflightChecksDialog,
} from '~/features/show/slice';
import { getSetupStageStatuses } from '~/features/show/stages';

/**
 * Component with a button that shows a dialog that allows the user to check the
 * results of the onboard preflight checks on the drones.
 */
const OnboardPreflightChecksButton = ({
  areChecksSignedOff,
  onApprove,
  onRevoke,
  status,
  ...rest
}) => {
  const { t } = useTranslation();

  return (
    <ListItemButton disabled={status === Status.OFF} {...rest}>
      <StatusLight status={status} />
      <ListItemText
        primary={t('show.onboardPreflightChecks', 'Onboard preflight checks')}
      />
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
    </ListItemButton>
  );
};

OnboardPreflightChecksButton.propTypes = {
  areChecksSignedOff: PropTypes.bool,
  onApprove: PropTypes.func,
  onRevoke: PropTypes.func,
  status: PropTypes.oneOf(Object.values(Status)),
};

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
